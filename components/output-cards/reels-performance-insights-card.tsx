"use client";

import { useEffect, useMemo, useState } from "react";

import {
  readReelPerformanceRecords,
  REELS_PERFORMANCE_STORAGE_EVENT,
} from "@/lib/reels-performance-storage";
import { buildPerformanceInsights } from "@/lib/reels-performance-insights";

import type { ReelPerformanceGroupInsight } from "@/lib/reels-performance-insights";
import type { ReelPerformanceRecord } from "@/types";

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

function recordTitle(record: ReelPerformanceRecord): string {
  return [record.subjectA, record.subjectB].filter(Boolean).join(" vs ") || record.generationId;
}

function GroupStat({ label, insight }: { label: string; insight: ReelPerformanceGroupInsight | null }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)] p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--muted)]">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-[color:var(--text)]">
        {insight?.label ?? "No data yet"}
      </p>
      {insight && (
        <p className="mt-1 text-[11px] text-[color:var(--muted)]">
          Avg {insight.averageScore}/100 · {insight.count} record{insight.count === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

export default function ReelsPerformanceInsightsCard() {
  const [records, setRecords] = useState<ReelPerformanceRecord[]>([]);

  useEffect(() => {
    function loadRecords() {
      setRecords(readReelPerformanceRecords());
    }

    loadRecords();
    window.addEventListener(REELS_PERFORMANCE_STORAGE_EVENT, loadRecords);
    window.addEventListener("storage", loadRecords);
    return () => {
      window.removeEventListener(REELS_PERFORMANCE_STORAGE_EVENT, loadRecords);
      window.removeEventListener("storage", loadRecords);
    };
  }, []);

  const insights = useMemo(() => buildPerformanceInsights(records), [records]);

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
            Reels Learning Dashboard
          </p>
          <h3 className="mt-1 text-base font-black text-[color:var(--text)]">
            {records.length} saved performance record{records.length === 1 ? "" : "s"}
          </h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[color:var(--muted)]">
            Local-only analytics for story modes, hooks, captions, subjects, and habitats.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <GroupStat label="Best Story Mode" insight={insights.bestStoryMode} />
        <GroupStat label="Best Viral Lane" insight={insights.bestViralLane} />
        <GroupStat label="Best Habitat" insight={insights.bestHabitatRegion} />
        <GroupStat label="Best Subject Pair" insight={insights.bestSubjectPair} />
        <GroupStat label="Best Hook" insight={insights.bestHookUsed} />
        <GroupStat label="Best Caption" insight={insights.bestCaptionUsed} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-200">
            Top 5 Records
          </p>
          {insights.topRecords.length ? (
            <ol className="mt-3 space-y-2 text-xs text-[color:var(--muted)]">
              {insights.topRecords.map(({ record, score }, index) => (
                <li key={record.id} className="rounded-lg bg-[color:var(--surface-elevated)] p-2">
                  <span className="font-bold text-[color:var(--text)]">
                    {index + 1}. {recordTitle(record)} · {score}/100
                  </span>
                  <br />
                  {record.hookUsed || "No hook saved"} · {formatDate(record.updatedAt)}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-[color:var(--muted)]">
              Save a reel performance record to start ranking winners.
            </p>
          )}
        </div>

        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-200">
            Weakest 3 Records
          </p>
          {insights.weakestRecords.length ? (
            <ol className="mt-3 space-y-2 text-xs text-[color:var(--muted)]">
              {insights.weakestRecords.map(({ record, score }, index) => (
                <li key={record.id} className="rounded-lg bg-[color:var(--surface-elevated)] p-2">
                  <span className="font-bold text-[color:var(--text)]">
                    {index + 1}. {recordTitle(record)} · {score}/100
                  </span>
                  <br />
                  {record.notes || "Needs hook, caption, or first-frame review."}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-[color:var(--muted)]">
              Weak spots will appear here after you save more than one reel.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
