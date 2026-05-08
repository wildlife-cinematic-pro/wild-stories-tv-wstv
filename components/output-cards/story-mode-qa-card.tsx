"use client";

import { analyzeStoryModePackage } from "@/lib/story-mode-qa";

import type { GeneratedPackage } from "@/types";

const statusTone = {
  ready: "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200",
  "needs-review":
    "border-amber-400/30 bg-amber-500/10 text-amber-700 dark:text-amber-200",
  unsafe: "border-red-400/30 bg-red-500/10 text-red-700 dark:text-red-200",
};

export default function StoryModeQACard({ data }: { data: GeneratedPackage }) {
  const result = analyzeStoryModePackage(data);

  return (
    <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
            Story Mode QA
          </p>
          <h3 className="mt-1 text-base font-black text-[color:var(--text)]">
            {result.score}/100
          </h3>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${statusTone[result.status]}`}
        >
          {result.status.replace("-", " ")}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-200">
          {result.storyModeLabel}
        </span>
        <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-indigo-700 dark:text-indigo-200">
          {result.viralLaneLabel}
        </span>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-200">
          {result.violenceLevelLabel}
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-200">
            Passes
          </p>
          <ul className="mt-2 space-y-1 text-xs leading-relaxed text-[color:var(--muted)]">
            {result.passes.slice(0, 5).map((pass) => (
              <li key={pass}>• {pass}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-200">
            Warnings
          </p>
          {result.flags.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs leading-relaxed text-[color:var(--muted)]">
              {result.flags.slice(0, 5).map((flag) => (
                <li key={flag}>• {flag}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-[color:var(--muted)]">
              No QA warnings detected.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
