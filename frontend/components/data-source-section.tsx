import { AnimatedSection } from "@/components/animated-section";

const items = [
  {
    label: "Data Source",
    value: "Yahoo Finance API"
  },
  {
    label: "Market Data",
    value: "Daily OHLC price history"
  },
  {
    label: "Processing",
    value: "SignalForge indicator engine"
  }
];

export function DataSourceSection() {
  return (
    <AnimatedSection id="data-source" className="py-20" delay={0.08}>
      <div className="section-shell">
        <div className="glass-panel rounded-[2rem] p-8 md:p-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Data Source</p>
              <h2 className="section-heading mt-5">Real market data, productized into signals.</h2>
              <p className="section-copy mt-5">
                Market data is sourced from Yahoo Finance and processed through the SignalForge indicator engine to produce transparent scores, backtests, and ranked signals.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {items.map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
                <p className="mt-3 text-lg font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
