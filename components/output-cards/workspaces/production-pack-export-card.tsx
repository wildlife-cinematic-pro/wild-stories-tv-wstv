"use client";

import { buildProductionPackExport } from "@/lib/video-production-pack-export";
import type { GeneratedPackage } from "@/types";

export function ProductionPackExportCard({
  data,
  onCopy,
}: {
  data: GeneratedPackage;
  onCopy: (text: string) => void | Promise<unknown>;
}) {
  const pack = buildProductionPackExport(data);

  return (
    <div className="mt-3 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[color:var(--muted)]">
            Production Pack Export
          </div>
          <div className="mt-1 text-xs font-extrabold text-[color:var(--text)]">
            {pack.routeType}
          </div>
          <p className="mt-1 max-w-2xl text-[11px] font-semibold leading-relaxed text-[color:var(--muted)]">
            {pack.mainPromptPointer}
          </p>
        </div>
        <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-2 py-0.5 text-[10px] font-extrabold text-[color:var(--muted)]">
          {pack.workflowQAStatus}
        </span>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-2">
          <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[color:var(--muted)]">
            Selected Model
          </div>
          <p className="mt-1 text-xs font-bold text-[color:var(--text)]">
            {pack.selectedModel}
          </p>
        </div>
        <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-2">
          <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[color:var(--muted)]">
            Primary Route
          </div>
          <p className="mt-1 text-xs font-bold text-[color:var(--text)]">
            {pack.primaryRoute}
          </p>
        </div>
        <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-2">
          <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[color:var(--muted)]">
            Best Next Action
          </div>
          <p className="mt-1 text-xs font-bold text-[color:var(--text)]">
            {pack.bestNextAction}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onCopy(pack.copyText)}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-black active:scale-95 dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
        >
          Copy Production Pack
        </button>
        <button
          type="button"
          onClick={() => onCopy(pack.shortText)}
          className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-1.5 text-xs font-extrabold text-[color:var(--text)] hover:bg-[color:var(--surface)] active:scale-95"
        >
          Copy Short Pack
        </button>
        <button
          type="button"
          onClick={() => onCopy(pack.fullText)}
          className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-1.5 text-xs font-extrabold text-[color:var(--text)] hover:bg-[color:var(--surface)] active:scale-95"
        >
          Copy Full Pack
        </button>
      </div>
    </div>
  );
}
