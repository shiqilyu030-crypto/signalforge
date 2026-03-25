"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { fetchSignals, type SignalRecord } from "@/lib/api";

export function SignalsBoard() {
  const [entries, setEntries] = useState<SignalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<"fresh" | "cached" | null>(null);
  const [refreshIntervalSeconds, setRefreshIntervalSeconds] = useState<number | null>(null);
  const [universeSize, setUniverseSize] = useState<number | null>(null);
  const [symbolsScanned, setSymbolsScanned] = useState<number | null>(null);
  const [scoreThreshold, setScoreThreshold] = useState("0");
  const [rsiThreshold, setRsiThreshold] = useState("100");
  const [trendFilter, setTrendFilter] = useState("All");

  useEffect(() => {
    let active = true;

    async function loadSignals() {
      setLoading(true);
      setError(null);

      const results = await fetchSignals();
      if (!active) {
        return;
      }

      if (!results?.data?.length) {
        setEntries([]);
        setError("SignalForge could not load the leaderboard right now. Check the backend connection and try again.");
      } else {
        setEntries(results.data);
        setGeneratedAt(results.last_updated ?? results.generated_at ?? null);
        setCacheStatus(results.cache_status ?? null);
        setRefreshIntervalSeconds(results.refresh_interval_seconds ?? null);
        setUniverseSize(results.universe_size ?? null);
        setSymbolsScanned(results.symbols_scanned ?? null);
      }

      setLoading(false);
    }

    void loadSignals();

    return () => {
      active = false;
    };
  }, []);

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toUpperCase();
    const scoreFloor = Number(scoreThreshold) || 0;
    const rsiCeiling = Number(rsiThreshold) || 100;

    return entries.filter((entry) => {
      const searchMatch = !normalized || entry.ticker.includes(normalized);
      const scoreMatch = entry.score >= scoreFloor;
      const rsiMatch = typeof entry.rsi !== "number" || entry.rsi <= rsiCeiling;
      const trendMatch = trendFilter === "All" || entry.trend === trendFilter;
      return searchMatch && scoreMatch && rsiMatch && trendMatch;
    });
  }, [entries, query, scoreThreshold, rsiThreshold, trendFilter]);

  const topEntry = filteredEntries[0] ?? null;

  return (
    <main className="min-h-screen bg-canvas">
      <div className="section-shell py-8">
        <div className="glass-panel rounded-[2rem] px-6 py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-200/70">Signals</p>
              <h1 className="mt-2 font-[var(--font-heading)] text-4xl font-semibold text-white">
                Ranked signal leaderboard
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                SignalForge scans a broad universe of liquid US equities and ranks the strongest setups using a transparent multi-factor score.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Open Dashboard
              </Link>
              <Link
                href="/strategy"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Strategy Guide
              </Link>
              <Link
                href="/"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Back Home
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
            <p className="font-medium text-white">Signal Ranking</p>
            <p className="mt-1 text-slate-300">
              SignalForge scans a broad universe of liquid US equities and ranks the strongest setups with a transparent multi-factor model.
            </p>
            <p className="mt-1 text-slate-400">
              Universe: Top liquid US equities (~{universeSize ?? 139} symbols)
            </p>
            <p className="mt-1 text-slate-400">
              Scanned: {symbolsScanned ?? 0} symbols • Last updated {formatEasternTimestamp(generatedAt)}
            </p>
            <p className="mt-1 text-slate-500">
              {cacheStatus === "cached" ? "Served from cache" : "Fresh scan"} • Signals refresh every {formatRefreshCadence(refreshIntervalSeconds)}
            </p>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value.toUpperCase())}
            placeholder="Search ticker"
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-white/[0.06]"
          />
        </div>

        <div className="mt-4 grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 md:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Score Threshold</p>
            <select
              value={scoreThreshold}
              onChange={(event) => setScoreThreshold(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="0">All scores</option>
              <option value="45">Score &gt;= 45</option>
              <option value="60">Score &gt;= 60</option>
              <option value="80">Score &gt;= 80</option>
            </select>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">RSI Threshold</p>
            <select
              value={rsiThreshold}
              onChange={(event) => setRsiThreshold(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="100">All RSI</option>
              <option value="60">RSI &lt;= 60</option>
              <option value="50">RSI &lt;= 50</option>
              <option value="40">RSI &lt;= 40</option>
            </select>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Trend Filter</p>
            <select
              value={trendFilter}
              onChange={(event) => setTrendFilter(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="All">All</option>
              <option value="Bullish">Bullish</option>
              <option value="Bearish">Bearish</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-2 text-sm text-slate-300">
              {filteredEntries.length} ranked rows match
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-[1.75rem] border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <section className="glass-panel rounded-[2rem] p-6">
            <p className="text-sm text-slate-400">Top ranked right now</p>
            <h2 className="mt-1 font-[var(--font-heading)] text-2xl font-semibold text-white">Best current setup</h2>

            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
              {loading ? (
                <p className="text-sm text-slate-300">Loading ranked signals from the backend...</p>
              ) : topEntry ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{topEntry.ticker}</p>
                      <p className="mt-2 text-3xl font-semibold text-white">{formatCurrency(topEntry.price)}</p>
                      <p className="mt-3 text-sm text-slate-300">{topEntry.explanation}</p>
                    </div>
                    <div className={labelBadgeClass(topEntry.label)}>
                      Score {topEntry.score}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-4">
                    <SignalPill label="Label" value={topEntry.label} />
                    <SignalPill label="Trend" value={topEntry.trend} />
                    <SignalPill label="RSI" value={formatNumber(topEntry.rsi)} />
                    <SignalPill label="MACD" value={formatNumber(topEntry.macd)} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-300">No leaderboard data is available right now.</p>
              )}
            </div>
          </section>

          <section className="glass-panel rounded-[2rem] p-6">
            <p className="text-sm text-slate-400">Leaderboard</p>
            <h2 className="mt-1 font-[var(--font-heading)] text-2xl font-semibold text-white">
              Signal ranking table
            </h2>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10">
              <div className="grid grid-cols-9 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>Rank</span>
                <span>Ticker</span>
                <span>Price</span>
                <span>Spark</span>
                <span>Score</span>
                <span>Label</span>
                <span>RSI</span>
                <span>MACD</span>
                <span>Trend</span>
              </div>

              <div className="divide-y divide-white/8">
                {loading
                  ? Array.from({ length: 7 }).map((_, index) => (
                      <div key={index} className="grid grid-cols-9 px-4 py-4 text-sm text-slate-300">
                        <span>...</span>
                        <span>Loading</span>
                        <span>...</span>
                        <span>...</span>
                        <span>...</span>
                        <span>...</span>
                        <span>...</span>
                        <span>...</span>
                        <span>...</span>
                      </div>
                    ))
                  : filteredEntries.length
                    ? filteredEntries.map((entry) => (
                        <motion.div
                          key={entry.ticker}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4 }}
                          className="grid grid-cols-9 px-4 py-4 text-sm text-slate-200"
                        >
                          <span>#{entry.rank}</span>
                          <Link
                            href={`/dashboard?symbol=${encodeURIComponent(entry.ticker)}`}
                            className="font-medium text-white transition hover:text-cyan-200"
                          >
                            {entry.ticker}
                          </Link>
                          <span>{formatCurrency(entry.price)}</span>
                          <span>
                            <MiniSparkline values={entry.sparkline ?? []} />
                          </span>
                          <span>{entry.score}</span>
                          <span>
                            <span className={labelBadgeClass(entry.label)}>{entry.label}</span>
                          </span>
                          <span>{formatNumber(entry.rsi)}</span>
                          <span>{formatNumber(entry.macd)}</span>
                          <span>{entry.trend}</span>
                        </motion.div>
                      ))
                    : (
                        <div className="px-4 py-6 text-sm text-slate-300">
                          No ranked symbols match that ticker search right now.
                        </div>
                      )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function MiniSparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <span className="text-slate-500">Flat</span>;
  }

  const width = 72;
  const height = 24;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const direction = values[values.length - 1] >= values[0];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-6 w-[72px] overflow-visible">
      <polyline
        fill="none"
        stroke={direction ? "#67e8f9" : "#fda4af"}
        strokeWidth="2"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SignalPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  );
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

function formatNumber(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "Unavailable";
  }

  return value.toFixed(2);
}

function formatEasternTimestamp(value: string | null) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/New_York"
  }).format(date)} ET`;
}

function formatRefreshCadence(value: number | null) {
  if (!value) {
    return "a few minutes";
  }

  const minutes = Math.round(value / 60);
  return minutes <= 1 ? "1 minute" : `${minutes} minutes`;
}

function labelBadgeClass(label: string) {
  const base = "inline-flex rounded-full border px-3 py-1 text-xs font-medium";

  if (label === "Strong Buy") {
    return `${base} border-emerald-400/20 bg-emerald-400/12 text-emerald-200`;
  }

  if (label === "Buy") {
    return `${base} border-lime-300/20 bg-lime-300/12 text-lime-100`;
  }

  if (label === "Neutral") {
    return `${base} border-white/10 bg-white/[0.06] text-slate-200`;
  }

  if (label === "Weak") {
    return `${base} border-amber-300/20 bg-amber-300/12 text-amber-100`;
  }

  return `${base} border-rose-400/20 bg-rose-400/12 text-rose-200`;
}
