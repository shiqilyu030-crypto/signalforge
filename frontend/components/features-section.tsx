import { AnimatedSection } from "@/components/animated-section";
import { FeatureCard } from "@/components/feature-card";

const features = [
  {
    eyebrow: "Signal Scoring",
    title: "Transparent 0-100 signal scores",
    description:
      "Each ticker gets a composite score with visible trend, RSI, and MACD contributions so people can see why a name ranks well."
  },
  {
    eyebrow: "Backtesting",
    title: "Strategy metrics that add context",
    description:
      "Compare cumulative return, buy-and-hold return, CAGR, Sharpe ratio, and max drawdown in the same product surface."
  },
  {
    eyebrow: "Leaderboard",
    title: "Rank names by signal strength",
    description:
      "Surface a short list of the strongest setups across the watchlist with a clean leaderboard ready for public demo use."
  },
  {
    eyebrow: "Strategy Guide",
    title: "Explain how the model works",
    description:
      "Give users a dedicated page that explains indicator logic, scoring construction, backtest methodology, and key limitations."
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
          SignalForge combines market data, indicator-based scoring, transparent explanations, and leaderboard ranking in a lightweight quant discovery platform.
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
