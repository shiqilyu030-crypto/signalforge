import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

const sections = [
  {
    title: "Strategy Overview",
    body:
      "SignalForge is a lightweight quantitative signal platform that combines a trend filter, momentum signals, and a transparent score to rank setups in a public demo experience."
  },
  {
    title: "Trend Filter",
    body:
      "The model checks whether price is above the 50-day moving average. When price is above MA50, the setup earns the full trend contribution because the broader direction is supportive."
  },
  {
    title: "Momentum Signals",
    body:
      "RSI and MACD provide the momentum layer. RSI rewards softer, potentially recovering conditions, while MACD looks for improving confirmation and bullish crossovers."
  },
  {
    title: "Score Construction",
    body:
      "Scores run from 0 to 100. Trend contributes up to 30 points, RSI up to 30 points, and MACD up to 40 points. The final label maps into Strong Buy, Buy, Neutral, Weak, or Bearish."
  },
  {
    title: "Backtesting Method",
    body:
      "Backtests compare a simple moving-average crossover strategy against buy and hold. SignalForge reports cumulative return, buy and hold return, CAGR, Sharpe ratio, and max drawdown so the signal has performance context."
  },
  {
    title: "Limitations / Disclaimer",
    body:
      "This scoring model is intentionally simple and is provided for educational and demo purposes only. It should not be treated as investment advice or as a complete trading system."
  }
];

export default function StrategyPage() {
  return (
    <main className="min-h-screen bg-canvas">
      <SiteHeader />
      <section className="section-shell py-16">
        <div className="glass-panel rounded-[2rem] p-8 md:p-10">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-200/70">Strategy</p>
          <h1 className="mt-3 font-[var(--font-heading)] text-5xl font-semibold text-white">
            Transparent signal logic for a public quant demo
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            SignalForge explains how trend, RSI, and MACD combine into a score and how backtest metrics are used to add context around each ranked setup.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
            >
              Open Dashboard
            </Link>
            <Link
              href="/signals"
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View Signals
            </Link>
          </div>
        </div>

        <div className="mt-8 glass-panel rounded-[2rem] p-8 md:p-10">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-200/70">Scoring Formula</p>
          <h2 className="mt-3 font-[var(--font-heading)] text-3xl font-semibold text-white">
            Signal Score = Trend Score + RSI Score + MACD Score
          </h2>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Trend Score</p>
              <p className="mt-3 text-lg font-semibold text-white">Price &gt; MA50 → +30</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                The trend block rewards names that are trading above the 50-day moving average.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">RSI Score</p>
              <p className="mt-3 text-lg font-semibold text-white">RSI &lt; 35 → +30</p>
              <p className="mt-1 text-lg font-semibold text-white">RSI 35–50 → +15</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                RSI rewards softer momentum setups that may be recovering rather than already overextended.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">MACD Score</p>
              <p className="mt-3 text-lg font-semibold text-white">Bullish crossover → +40</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                MACD carries the largest weight because crossover confirmation is the strongest momentum signal in the current model.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {sections.map((section) => (
            <section key={section.title} className="glass-panel rounded-[2rem] p-6">
              <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/70">{section.title}</p>
              <p className="mt-4 text-sm leading-7 text-slate-300">{section.body}</p>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
