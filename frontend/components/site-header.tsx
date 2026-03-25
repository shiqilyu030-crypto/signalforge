"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const navItems = [
  { label: "Features", href: "#features" },
  { label: "Preview", href: "#preview" },
  { label: "API Status", href: "#status" },
  { label: "Get Started", href: "#cta" }
];

export function SiteHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="sticky top-0 z-40 border-b border-white/8 bg-canvas/70 backdrop-blur-xl"
    >
      <div className="section-shell flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-sm font-semibold text-cyan-200 shadow-halo">
              SF
            </div>
            <div>
              <p className="font-[var(--font-heading)] text-sm font-semibold tracking-[0.24em] text-cyan-200/80 uppercase">
                SignalForge
              </p>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </a>
          ))}
          <Link
            href="/signals"
            className="rounded-full border border-white/12 bg-white/5 px-4 py-2 font-medium text-white transition hover:bg-white/10"
          >
            Top Signals
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-white/12 bg-white/5 px-4 py-2 font-medium text-white transition hover:bg-white/10"
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
