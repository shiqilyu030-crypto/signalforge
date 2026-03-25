"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  fetchStrategy
} from "@/lib/api";
import { DEFAULT_WATCHLIST } from "@/lib/watchlist";

const FILTERS = ["All", "Bullish", "Neutral", "Weak"] as const;
type SignalFilter = (typeof FILTERS)[number];

type SignalLeaderboardEntry = {
  symbol: string;
  score: number;
  signal: string;
  trend: string;
  momentum: string;
  confidence: string;
};

export function SignalsBoard() {
  const [entries, setEntries] = useState<SignalLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SignalFilter>("All");

  useEffect(() => {
    let active = true;

    async function loadSignals() {
      setLoading(true);
      setError(null);

      const results = await Promise.all(
        DEFAULT_WATCHLIST.map(async (symbol): Promise<SignalLeaderboardEntry | null> => {
          const strategy = await fetchStrategy(symbol);
          if (!strategy) {
            return null;
          }

          return {
            symbol,
            score: strategy.score,
            signal: strategy.signal,
            trend: strategy.trend,
            momentum: strategy.momentum,
            confidence: strategy.confidence
          };
        })
      );

      if (!active) {
        return;
      }

      const builtEntries = results
        .filter((entry): entry is SignalLeaderboardEntry => entry !== null)
        .sort((left, right) => right.score - left.score);

      if (!builtEntries.length) {
        setError("SignalForge could not load the watchlist right now. Check the backend connection and try again.");
      }

      setEntries(builtEntries);
      setLoading(false);
    }

    void loadSignals();

    return () => {
      active = false;
    };
  }, []);

  const filteredEntries = useMemo(() => filterSignalEntries(entries, filter), [entries, filter]);
  const topEntry = filteredEntries[0] ?? null;

  return (
    <main className="min-h-screen bg-canvas">
      <div className="section-shell py-8">
        <div className="glass-panel rounded-[2rem] px-6 py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-200/70">Top Signals</p>
              <h1 className="mt-2 font-[var(--font-heading)] text-4xl font-semibold text-white">
                SignalForge watchlist leaderboard
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                A fast ranking view across the default watchlist, sorted by the backend signal score so people can spot the strongest setups first.
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
                href="/"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Back Home
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                filter === item
                  ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                  : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mt-6 rounded-[1.75rem] border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="glass-panel rounded-[2rem] p-6">
            <p className="text-sm text-slate-400">Highest ranked right now</p>
            <h2 className="mt-1 font-[var(--font-heading)] text-2xl font-semibold text-white">Top setup</h2>

            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
              {loading ? (
                <p className="text-sm text-slate-300">Scanning the watchlist and ranking setups...</p>
              ) : topEntry ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{topEntry.symbol}</p>
                      <p className="mt-2 text-3xl font-semibold text-white">Score {topEntry.score}</p>
                    </div>
                    <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
                      {topEntry.confidence} confidence
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-4">
                    <SignalPill label="Trend" value={topEntry.trend} />
                    <SignalPill label="Momentum" value={topEntry.momentum} />
                    <SignalPill label="Signal" value={topEntry.signal} />
                    <SignalPill label="Confidence" value={topEntry.confidence} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-300">No symbols match the current filter.</p>
              )}
            </div>
          </section>

          <section className="glass-panel rounded-[2rem] p-6">
            <p className="text-sm text-slate-400">Leaderboard</p>
            <h2 className="mt-1 font-[var(--font-heading)] text-2xl font-semibold text-white">
              Ranked watchlist signals
            </h2>

            <div className="mt-6 grid gap-4">
              {loading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-40 animate-pulse rounded-[1.5rem] border border-white/10 bg-white/[0.03]"
                    />
                  ))
                : filteredEntries.map((entry, index) => (
                    <motion.article
                      key={entry.symbol}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.04 }}
                      className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                              #{index + 1}
                            </span>
                            <h3 className="font-[var(--font-heading)] text-2xl font-semibold text-white">
                              {entry.symbol}
                            </h3>
                          </div>
                          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                            A backend-ranked setup with {entry.confidence.toLowerCase()} confidence and a {entry.momentum.toLowerCase()} momentum read.
                          </p>
                        </div>

                        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm font-medium text-cyan-100">
                          Score {entry.score}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                        <LeaderboardStat label="Symbol" value={entry.symbol} />
                        <LeaderboardStat label="Score" value={String(entry.score)} />
                        <LeaderboardStat label="Confidence" value={entry.confidence} />
                        <LeaderboardStat label="Trend" value={entry.trend} />
                        <LeaderboardStat label="Momentum" value={entry.momentum} />
                        <LeaderboardStat label="Signal" value={entry.signal} />
                      </div>
                    </motion.article>
                  ))}
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

function LeaderboardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-white/10 bg-slate-950/40 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function filterSignalEntries(entries: SignalLeaderboardEntry[], filter: SignalFilter) {
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
