import { AnimatedSection } from "@/components/animated-section";
import { FeatureCard } from "@/components/feature-card";

const features = [
  {
    eyebrow: "FastAPI",
    title: "Fast stock lookups and signal data",
    description:
      "Load price history, indicators, strategy summaries, and health checks from one backend API that powers the frontend experience."
  },
  {
    eyebrow: "PostgreSQL",
    title: "Reliable market data storage",
    description:
      "Store daily stock and ETF prices in PostgreSQL so repeated refreshes stay clean and your dashboards have a dependable source of truth."
  },
  {
    eyebrow: "ETL",
    title: "Simple refresh workflows",
    description:
      "Refresh the default watchlist on a schedule, backfill history, and keep symbols ready for search without relying on manual spreadsheet work."
  },
  {
    eyebrow: "Indicators",
    title: "Readable signal analysis",
    description:
      "Review moving averages, RSI, MACD, and strategy signals in plain language so it is easier to spot strong setups and weaker ones."
  }
];

export function FeaturesSection() {
  return (
    <AnimatedSection id="features" className="py-24" delay={0.05}>
      <div className="section-shell">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Platform Features</p>
        <h2 className="section-heading mt-5">
          Everything you need to search stocks, read signals, and compare simple strategies.
        </h2>
        <p className="section-copy mt-5">
          SignalForge brings together stock data, technical indicators, backend APIs, and watchlist monitoring in one product experience that is easy to explore.
        </p>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
