import { AnimatedSection } from "@/components/animated-section";
import { FeatureCard } from "@/components/feature-card";

const features = [
  {
    eyebrow: "Indicators",
    title: "Technical indicators that stay readable",
    description:
      "Review moving averages, RSI, and MACD in a format that feels more like a product dashboard than a trading notebook."
  },
  {
    eyebrow: "Backtesting",
    title: "Simple strategy backtesting",
    description:
      "Compare cumulative strategy returns against buy-and-hold so each ticker has clear performance context."
  },
  {
    eyebrow: "Signal Scoring",
    title: "Rank names by signal strength",
    description:
      "Surface a short list of the strongest setups using backend scoring based on trend, momentum, and recent strategy behavior."
  },
  {
    eyebrow: "Public Demo",
    title: "A polished public-facing experience",
    description:
      "Open the landing page, dashboard, and signals leaderboard as a clean SaaS-style demo that works well on Vercel."
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
          SignalForge brings together stock search, signal scoring, strategy backtests, and clean API-driven visuals in one simple product surface.
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
