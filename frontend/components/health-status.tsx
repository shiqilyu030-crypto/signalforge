"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { API_BASE, fetchHealth, type HealthResponse } from "@/lib/api";

import { AnimatedSection } from "@/components/animated-section";

export function HealthStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadHealth() {
      const result = await fetchHealth();
      if (!active) {
        return;
      }
      setHealth(result);
      setLoading(false);
    }

    void loadHealth();

    return () => {
      active = false;
    };
  }, []);

  return (
    <AnimatedSection id="status" className="py-24" delay={0.12}>
      <div className="section-shell">
        <div className="glass-panel overflow-hidden rounded-[2rem] p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200/70">API Health</p>
              <h2 className="section-heading mt-5">Operational visibility built into the experience.</h2>
              <p className="section-copy mt-5">
                Point the frontend at any environment using <code>NEXT_PUBLIC_API_URL</code> and surface health checks directly in the product layer.
              </p>
              <p className="mt-6 text-sm text-slate-400">Current API target: {API_BASE}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <StatusCard
                label="API"
                value={loading ? "Checking..." : health?.api_status ?? "Unavailable"}
                tone={health?.api_status === "ok" ? "good" : "neutral"}
              />
              <StatusCard
                label="Database"
                value={loading ? "Checking..." : health?.database_status ?? "Unavailable"}
                tone={health?.database_status === "ok" ? "good" : "neutral"}
              />
              <StatusCard
                label="Timestamp"
                value={loading ? "Waiting..." : formatTimestamp(health?.timestamp)}
                tone="neutral"
              />
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

function StatusCard({
  label,
  value,
  tone
}: {
  label: string;
  value: string;
  tone: "good" | "neutral";
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
      : "border-white/10 bg-white/[0.04] text-white";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55 }}
      className={`rounded-[1.5rem] border p-5 ${toneClass}`}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-4 break-words text-lg font-semibold">{value}</p>
    </motion.div>
  );
}

function formatTimestamp(timestamp?: string) {
  if (!timestamp) {
    return "Unavailable";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString();
}
