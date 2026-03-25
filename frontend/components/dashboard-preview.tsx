"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { AnimatedSection } from "@/components/animated-section";

const tickerCards = [
  { symbol: "AAPL", change: "+2.14%", sentiment: "Bullish bias" },
  { symbol: "MSFT", change: "+1.41%", sentiment: "Momentum building" },
  { symbol: "SPY", change: "-0.24%", sentiment: "Range-bound" },
  { symbol: "META", change: "+0.86%", sentiment: "Leadership returning" }
];

export function DashboardPreview() {
  return (
    <AnimatedSection id="preview" className="py-24" delay={0.1}>
      <div className="section-shell grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Interactive Preview</p>
          <h2 className="section-heading mt-5">A dashboard built for quickly checking stocks and seeing what matters.</h2>
          <p className="section-copy mt-5">
            Open a ticker, review the latest close, inspect RSI and MACD, compare the strategy equity curve against the market, and jump into a ranked signals view.
          </p>

          <div className="mt-10 space-y-4 text-sm text-slate-300">
            <div className="glass-panel rounded-3xl p-5">
              Switch between local and deployed backends with <code>NEXT_PUBLIC_API_URL</code> and keep the same product experience.
            </div>
            <div className="glass-panel rounded-3xl p-5">
              Follow a small watchlist, review signal strength, and compare strategy versus market performance over time.
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex w-fit items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 font-medium text-cyan-100 transition hover:bg-cyan-300/15"
              >
                Explore the dashboard
              </Link>
              <Link
                href="/signals"
                className="inline-flex w-fit items-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
              >
                Open top signals
              </Link>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.75 }}
          className="glass-panel rounded-[2rem] p-5"
        >
          <div className="rounded-[1.6rem] border border-white/10 bg-slate-950/75 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">Dashboard Preview</p>
                <h3 className="mt-1 text-2xl font-semibold text-white">Stock analysis at a glance</h3>
              </div>
              <div className="flex gap-2">
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">Realtime feel</span>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                  API-first
                </span>
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Strategy curve</p>
                    <p className="mt-1 text-lg font-semibold text-white">Simple strategy vs buy-and-hold</p>
                  </div>
                  <span className="text-sm text-emerald-300">+18.4%</span>
                </div>
                <div className="mt-6 h-56 rounded-[1.25rem] bg-gradient-to-b from-cyan-400/10 to-transparent p-4">
                  <div className="relative h-full overflow-hidden rounded-[1rem] border border-white/6 bg-slate-950/60">
                    <div className="absolute inset-x-0 bottom-0 top-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_top,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px]" />
                    <svg viewBox="0 0 500 220" className="absolute inset-0 h-full w-full">
                      <path
                        d="M0 170 C40 160, 70 145, 105 150 S180 162, 230 118 S320 76, 365 96 S435 118, 500 54"
                        fill="none"
                        stroke="rgba(110,231,183,0.95)"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                      <path
                        d="M0 184 C35 178, 82 174, 126 168 S222 140, 268 146 S364 122, 406 116 S460 112, 500 104"
                        fill="none"
                        stroke="rgba(125,211,252,0.72)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="7 8"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {tickerCards.map((card, index) => (
                  <motion.div
                    key={card.symbol}
                    initial={{ opacity: 0, x: 18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, delay: 0.08 * index }}
                    className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{card.symbol}</p>
                        <p className="mt-2 text-lg font-semibold text-white">{card.sentiment}</p>
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-cyan-200">
                        {card.change}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatedSection>
  );
}
