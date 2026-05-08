"use client";

import { useEffect, useMemo, useState } from "react";

import {
  readABExperimentRecords,
  AB_EXPERIMENT_STORAGE_EVENT,
} from "@/lib/ab-experiment-storage";
import { serializeLocalCreatorDataExport } from "@/lib/local-creator-data-export";
import {
  readReelPerformanceRecords,
  REELS_PERFORMANCE_STORAGE_EVENT,
} from "@/lib/reels-performance-storage";

import type { ABExperimentRecord, ReelPerformanceRecord } from "@/types";

export default function LocalCreatorDataCard({
  onCopy,
}: {
  onCopy?: (text: string) => void | Promise<unknown>;
}) {
  const [performanceRecords, setPerformanceRecords] = useState<
    ReelPerformanceRecord[]
  >([]);
  const [abExperiments, setABExperiments] = useState<ABExperimentRecord[]>([]);
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    function loadLocalData() {
      setPerformanceRecords(readReelPerformanceRecords());
      setABExperiments(readABExperimentRecords());
    }

    loadLocalData();
    window.addEventListener(REELS_PERFORMANCE_STORAGE_EVENT, loadLocalData);
    window.addEventListener(AB_EXPERIMENT_STORAGE_EVENT, loadLocalData);
    window.addEventListener("storage", loadLocalData);
    return () => {
      window.removeEventListener(REELS_PERFORMANCE_STORAGE_EVENT, loadLocalData);
      window.removeEventListener(AB_EXPERIMENT_STORAGE_EVENT, loadLocalData);
      window.removeEventListener("storage", loadLocalData);
    };
  }, []);

  const exportJson = useMemo(
    () =>
      serializeLocalCreatorDataExport({
        performanceRecords,
        abExperiments,
      }),
    [abExperiments, performanceRecords]
  );

  async function handleCopyExport() {
    if (onCopy) {
      await onCopy(exportJson);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(exportJson);
    }
    setCopyStatus("Local data JSON copied");
    window.setTimeout(() => setCopyStatus(""), 1800);
  }

  return (
    <section className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">
            Local Data Notice
          </p>
          <h3 className="mt-1 text-base font-black text-[color:var(--text)]">
            Manual tracking stays in this browser
          </h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[color:var(--muted)]">
            Performance records and A/B experiments use localStorage only. No
            Facebook API, scraping, automatic posting, or cloud sync is used.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopyExport}
          className="rounded-xl border border-cyan-400/30 bg-[color:var(--surface-elevated)] px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-cyan-700 hover:bg-[color:var(--surface-muted)] active:scale-95 dark:text-cyan-200"
        >
          Copy Local Data JSON
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--muted)]">
            Performance Records
          </p>
          <p className="mt-1 text-2xl font-black text-[color:var(--text)]">
            {performanceRecords.length}
          </p>
        </div>
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--muted)]">
            A/B Experiments
          </p>
          <p className="mt-1 text-2xl font-black text-[color:var(--text)]">
            {abExperiments.length}
          </p>
        </div>
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--muted)]">
            Export
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted)]">
            Copies a readable JSON snapshot for backup or review.
          </p>
        </div>
      </div>

      {copyStatus && (
        <p className="mt-3 text-xs font-semibold text-cyan-700 dark:text-cyan-200">
          {copyStatus}
        </p>
      )}
    </section>
  );
}
