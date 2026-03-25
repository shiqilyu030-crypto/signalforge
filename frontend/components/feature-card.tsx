type FeatureCardProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function FeatureCard({ eyebrow, title, description }: FeatureCardProps) {
  return (
    <article className="glass-panel rounded-[1.75rem] p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/20">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">{eyebrow}</p>
      <h3 className="mt-4 font-[var(--font-heading)] text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-300">{description}</p>
    </article>
  );
}
