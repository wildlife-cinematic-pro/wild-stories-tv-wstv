"use client";

import { useEffect, useMemo, useState } from "react";

import {
  readABExperimentRecords,
  AB_EXPERIMENT_STORAGE_EVENT,
} from "@/lib/ab-experiment-storage";
import { serializeLocalCreatorDataExport } from "@/lib/local-creator-data-export";
import {
  restoreLocalCreatorDataFromJson,
  type LocalCreatorDataRestoreOptions,
  type LocalCreatorDataRestoreResult,
} from "@/lib/local-creator-data-import";
import {
  readReelPerformanceRecords,
  REELS_PERFORMANCE_STORAGE_EVENT,
} from "@/lib/reels-performance-storage";
import { clearLastGeneratedOutput, readLastGeneratedOutput } from "@/lib/storage";

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
  const [importJson, setImportJson] = useState("");
  const [restoreStatus, setRestoreStatus] = useState("");
  const [restoreErrors, setRestoreErrors] = useState<string[]>([]);
  const [restoreWarnings, setRestoreWarnings] = useState<string[]>([]);
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);
  const [hasSavedOutput, setHasSavedOutput] = useState(false);
  const [clearSavedOutputStatus, setClearSavedOutputStatus] = useState("");

  useEffect(() => {
    function loadLocalData() {
      setPerformanceRecords(readReelPerformanceRecords());
      setABExperiments(readABExperimentRecords());
      setHasSavedOutput(Boolean(readLastGeneratedOutput()));
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

  function setRestoreResult(result: LocalCreatorDataRestoreResult) {
    setRestoreWarnings(result.warnings);
    setRestoreErrors(result.errors);

    if (!result.ok) {
      setRestoreStatus("Restore blocked. Fix the JSON and try again.");
      return;
    }

    setRestoreStatus(
      result.mode === "replace"
        ? "Backup restored and replaced local tracking data."
        : "Backup restored and merged with local tracking data."
    );
    setImportJson("");
    setReplaceConfirmed(false);
  }

  function handleClearSavedOutput() {
    clearLastGeneratedOutput();
    setHasSavedOutput(false);
    setClearSavedOutputStatus("Saved generated output cleared from this browser.");
    window.setTimeout(() => setClearSavedOutputStatus(""), 2200);
  }

  function handleRestore(mode: LocalCreatorDataRestoreOptions["mode"]) {
    if (mode === "replace" && !replaceConfirmed) {
      setRestoreErrors(["Confirm replace restore before overwriting local tracker data."]);
      setRestoreWarnings([]);
      setRestoreStatus("Replace restore blocked.");
      return;
    }

    setRestoreErrors([]);
    setRestoreWarnings([]);
    setRestoreStatus("");

    try {
      setRestoreResult(restoreLocalCreatorDataFromJson(importJson, { mode }));
    } catch (error) {
      setRestoreErrors([error instanceof Error ? error.message : "Restore failed."]);
      setRestoreStatus("Restore blocked. Fix the JSON and try again.");
    }
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
            Saved Output
          </p>
          <p className="mt-1 text-2xl font-black text-[color:var(--text)]">
            {hasSavedOutput ? "1" : "0"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted)]">
            Last generated package snapshot saved for restore.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-200">
              Saved generated output
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted)]">
              Clear only the last generated package restore snapshot. Performance records and A/B experiments stay untouched.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearSavedOutput}
            disabled={!hasSavedOutput}
            className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-rose-700 hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-40 dark:text-rose-200"
          >
            Clear saved output
          </button>
        </div>
        {clearSavedOutputStatus && (
          <p className="mt-2 text-xs font-semibold text-cyan-700 dark:text-cyan-200">
            {clearSavedOutputStatus}
          </p>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-cyan-400/20 bg-[color:var(--surface-elevated)] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-200">
              Restore Local Data JSON
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted)]">
              Paste a previous WSTV local export. Merge keeps existing records and updates matching IDs; replace overwrites local tracking data.
            </p>
          </div>
        </div>
        <textarea
          value={importJson}
          onChange={(event) => setImportJson(event.target.value)}
          placeholder="Paste WSTV Local Data JSON here"
          className="mt-3 min-h-32 w-full resize-y rounded-xl border border-[color:var(--border)] bg-black/20 p-3 font-mono text-xs leading-relaxed text-[color:var(--text)] outline-none ring-0 placeholder:text-[color:var(--muted)] focus:border-cyan-400/50"
        />
        <label className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs font-semibold leading-relaxed text-amber-800 dark:text-amber-100">
          <input
            type="checkbox"
            checked={replaceConfirmed}
            onChange={(event) => setReplaceConfirmed(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-amber-400/40 bg-black/30 accent-amber-500"
          />
          <span>I understand this will replace current local tracker data in this browser.</span>
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleRestore("merge")}
            disabled={!importJson.trim()}
            className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-emerald-700 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-40 dark:text-emerald-200"
          >
            Merge Restore
          </button>
          <button
            type="button"
            onClick={() => handleRestore("replace")}
            disabled={!importJson.trim() || !replaceConfirmed}
            title={
              replaceConfirmed
                ? "Replace local performance and A/B experiment records."
                : "Confirm replace restore before overwriting local tracker data."
            }
            className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-amber-700 hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-40 dark:text-amber-200"
          >
            Replace Restore
          </button>
        </div>
      </div>

      {copyStatus && (
        <p className="mt-3 text-xs font-semibold text-cyan-700 dark:text-cyan-200">
          {copyStatus}
        </p>
      )}
      {restoreStatus && (
        <p className="mt-3 text-xs font-semibold text-cyan-700 dark:text-cyan-200">
          {restoreStatus}
        </p>
      )}
      {restoreWarnings.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs font-semibold text-amber-700 dark:text-amber-200">
          {restoreWarnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
      {restoreErrors.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs font-semibold text-red-700 dark:text-red-200">
          {restoreErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
