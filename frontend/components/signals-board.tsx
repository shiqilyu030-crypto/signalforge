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
  const [universeSize, setUniverseSize] = useState<number | null>(null);
  const [symbolsScanned, setSymbolsScanned] = useState<number | null>(null);

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
    if (!normalized) {
      return entries;
    }
    return entries.filter((entry) => entry.ticker.includes(normalized));
  }, [entries, query]);

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
                Scanning a broader US equity universe through the SignalForge indicator engine, then ranking the strongest setups by score with transparent price, RSI, and MACD context.
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
              Scanning ~{universeSize ?? 150} US equities using the SignalForge indicator engine.
            </p>
            <p className="mt-1 text-slate-400">
              Scanned {symbolsScanned ?? 0} stocks • Last updated {formatEasternTimestamp(generatedAt)}
            </p>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value.toUpperCase())}
            placeholder="Search ticker"
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/40 focus:bg-white/[0.06]"
          />
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
              <div className="grid grid-cols-8 bg-white/[0.04] px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>Rank</span>
                <span>Ticker</span>
                <span>Price</span>
                <span>Score</span>
                <span>Label</span>
                <span>Trend</span>
                <span>RSI</span>
                <span>MACD</span>
              </div>

              <div className="divide-y divide-white/8">
                {loading
                  ? Array.from({ length: 7 }).map((_, index) => (
                      <div key={index} className="grid grid-cols-8 px-4 py-4 text-sm text-slate-300">
                        <span>...</span>
                        <span>Loading</span>
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
                          className="grid grid-cols-8 px-4 py-4 text-sm text-slate-200"
                        >
                          <span>#{entry.rank}</span>
                          <span className="font-medium text-white">{entry.ticker}</span>
                          <span>{formatCurrency(entry.price)}</span>
                          <span>{entry.score}</span>
                          <span>
                            <span className={labelBadgeClass(entry.label)}>{entry.label}</span>
                          </span>
                          <span>{entry.trend}</span>
                          <span>{formatNumber(entry.rsi)}</span>
                          <span>{formatNumber(entry.macd)}</span>
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
