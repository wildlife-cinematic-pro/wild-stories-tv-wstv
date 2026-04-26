"use client";

import { useEffect, useState } from "react";

import { getUsageStats } from "@/lib/usage-tracker";

type UsageStats = ReturnType<typeof getUsageStats>;

function formatHookLabel(value: string): string {
  return value === "unknown" ? "Unknown" : value;
}

export function AnalyticsPanel() {
  const [stats, setStats] = useState<UsageStats>(() => getUsageStats());

  useEffect(() => {
    const syncStats = () => {
      setStats(getUsageStats());
    };

    syncStats();
    window.addEventListener("storage", syncStats);
    window.addEventListener("wstv-usage-updated", syncStats);

    return () => {
      window.removeEventListener("storage", syncStats);
      window.removeEventListener("wstv-usage-updated", syncStats);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-900 dark:text-cyan-100">
            Usage Analytics
          </div>
          <p className="mt-1 text-sm leading-relaxed text-cyan-900/85 dark:text-cyan-100/85">
            Local usage history from this browser helps surface how often the publish workflow gets used.
          </p>
        </div>
        <span className="rounded-full border border-cyan-500/30 bg-white/70 px-2.5 py-1 text-[11px] font-bold text-cyan-900 dark:bg-cyan-500/15 dark:text-cyan-100">
          Last 100 events
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-cyan-500/20 bg-[color:var(--surface-elevated)] p-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Total Actions
          </div>
          <div className="mt-2 text-2xl font-black text-[color:var(--text)]">
            {stats.totalEvents}
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/20 bg-[color:var(--surface-elevated)] p-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Publish Actions
          </div>
          <div className="mt-2 text-2xl font-black text-[color:var(--text)]">
            {stats.publishCount}
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/20 bg-[color:var(--surface-elevated)] p-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Avg Score
          </div>
          <div className="mt-2 text-2xl font-black text-[color:var(--text)]">
            {stats.avgScore}
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/20 bg-[color:var(--surface-elevated)] p-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Top Hook Used
          </div>
          <div className="mt-2 text-lg font-black text-[color:var(--text)]">
            {formatHookLabel(stats.topHooks[0] ?? "unknown")}
          </div>
        </div>
      </div>
    </div>
  );
}
