"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const proofPoints = [
  "Transparent 0-100 scoring",
  "Rank the strongest signals",
  "Compare strategy and market returns"
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-hero-grid">
      <div className="section-shell relative flex min-h-[88vh] flex-col justify-center py-24">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-slate-300 shadow-halo"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Quant Signal Platform
        </motion.div>

        <div className="mt-10 grid gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.1 }}
              className="max-w-4xl font-[var(--font-heading)] text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl"
            >
              A public quant signal platform with transparent scores, ranked opportunities, and clean backtest context.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.2 }}
              className="mt-7 max-w-2xl text-lg leading-8 text-slate-300"
            >
              SignalForge turns technical indicators into readable signal scores, clear explanations, and a leaderboard experience that feels like a lightweight SaaS product instead of a notebook.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.3 }}
              className="mt-10 flex flex-col gap-4 sm:flex-row"
            >
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-100"
              >
                Open Live Dashboard
              </Link>
              <Link
                href="/signals"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                View Top Signals
              </Link>
              <Link
                href="/strategy"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Learn the Strategy
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.4 }}
              className="mt-12 flex flex-wrap gap-3"
            >
              {proofPoints.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300"
                >
                  {item}
                </span>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-panel relative rounded-[2rem] p-5"
          >
            <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/70 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Live System View</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">SignalForge Overview</h2>
                </div>
                <div className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  Healthy
                </div>
              </div>

              <div className="mt-8 grid gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Request throughput</span>
                    <span className="text-cyan-300">1.2k/min</span>
                  </div>
                  <div className="mt-4 h-24 rounded-2xl bg-gradient-to-r from-cyan-400/10 via-sky-400/5 to-violet-500/10 p-3">
                    <div className="flex h-full items-end gap-2">
                      {[38, 54, 45, 68, 72, 64, 84, 90, 76, 98].map((value) => (
                        <div
                          key={value}
                          className="flex-1 rounded-t-xl bg-gradient-to-t from-cyan-400 to-violet-400"
                          style={{ height: `${value}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm text-slate-400">Coverage</p>
                    <p className="mt-2 text-3xl font-semibold text-white">Stocks and ETFs</p>
                    <p className="mt-2 text-sm text-slate-300">Track names like AAPL, NVDA, AMZN, META, and SPY in one watchlist.</p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm text-slate-400">Signals</p>
                    <p className="mt-2 text-3xl font-semibold text-white">MA, RSI, MACD</p>
                    <p className="mt-2 text-sm text-slate-300">See trend, momentum, and strategy context without digging through raw data.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
