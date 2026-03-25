import { AnimatedSection } from "@/components/animated-section";

export function CtaSection() {
  return (
    <AnimatedSection id="cta" className="pb-24 pt-12" delay={0.15}>
      <div className="section-shell">
        <div className="glass-panel relative overflow-hidden rounded-[2rem] border-white/12 p-8 md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.16),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.18),transparent_28%)]" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/70">Call to Action</p>
              <h2 className="mt-5 font-[var(--font-heading)] text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Bring stock search, signal analysis, and strategy review into one polished workflow.
              </h2>
              <p className="mt-5 text-base leading-7 text-slate-300 md:text-lg">
                Connect the frontend to your backend, refresh the watchlist, and give people a clear way to explore stocks and signals in one place.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <a
                href="https://nextjs.org/docs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5"
              >
                Deploy the Frontend
              </a>
              <a
                href="#status"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Check API Status
              </a>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
