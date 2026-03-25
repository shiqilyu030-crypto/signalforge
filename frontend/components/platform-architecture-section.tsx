import { AnimatedSection } from "@/components/animated-section";

const steps = [
  "Yahoo Finance market data",
  "Price normalization",
  "Indicator engine",
  "Signal scoring",
  "Backtest metrics",
  "FastAPI endpoints",
  "Next.js dashboard"
];

export function PlatformArchitectureSection() {
  return (
    <AnimatedSection id="architecture" className="py-24" delay={0.08}>
      <div className="section-shell">
        <div className="glass-panel rounded-[2rem] p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/70">How It Works</p>
          <h2 className="section-heading mt-5">A lightweight data pipeline behind the product.</h2>
          <p className="section-copy mt-5">
            SignalForge is built as a simple market-data platform: normalized price history flows into an indicator engine, a transparent scoring layer, backtest analytics, and API-driven product surfaces.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step) => (
              <div key={step} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm font-medium leading-6 text-white">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
