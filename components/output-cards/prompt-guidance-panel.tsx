"use client";

import { buildPromptClarityReport } from "@/lib/prompt-clarity";

import type { GeneratedPackage } from "@/types";

function scoreTone(score: number): string {
  if (score >= 85) return "text-emerald-700 dark:text-emerald-200";
  if (score >= 70) return "text-amber-700 dark:text-amber-200";
  return "text-rose-700 dark:text-rose-200";
}

function warningTone(severity: "warning" | "danger"): string {
  return severity === "danger"
    ? "border-rose-300 bg-rose-500/12 text-rose-900 dark:text-rose-100"
    : "border-amber-300 bg-amber-500/12 text-amber-900 dark:text-amber-100";
}

export function PromptGuidancePanel({
  data,
  onCopy,
}: {
  data: GeneratedPackage;
  onCopy: (text: string) => void | Promise<unknown>;
}) {
  const report = buildPromptClarityReport(data);
  const promptCards = [report.simplePrompt, report.primaryPrompt, report.cinematicPrompt];
  const scoreCards = [
    { label: "Paste readiness", value: report.scores.pasteReadinessScore },
    { label: "Subject clarity", value: report.scores.subjectClarityScore },
    { label: "Animal realism", value: report.scores.animalRealismScore },
    { label: "Motion feasibility", value: report.scores.motionFeasibilityScore },
    { label: "Engine compliance", value: report.scores.engineComplianceScore },
    { label: "Viral hook", value: report.scores.viralHookStrength },
  ];

  return (
    <div className="rounded-2xl border border-cyan-200 bg-cyan-500/8 p-4 shadow-sm dark:border-cyan-500/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-200">
            Prompt Guidance
          </div>
          <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-[color:var(--text)]">
            Fast copy first, advanced control when you want it
          </h3>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600 dark:text-[color:var(--muted)]">
            This layer keeps the studio-grade prompts intact while surfacing one simple concept prompt, one first-copy prompt, and one advanced cinematic prompt.
          </p>
        </div>
        <div className="rounded-full border border-cyan-200 bg-white px-3 py-1 text-[11px] font-bold text-cyan-800 dark:border-cyan-500/20 dark:bg-[color:var(--surface-elevated)] dark:text-cyan-100">
          Subject → Action → Environment → Lighting → Style
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        {promptCards.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-cyan-200 bg-white/95 p-3 dark:border-[color:var(--border)] dark:bg-[color:var(--surface-elevated)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-black text-slate-900 dark:text-[color:var(--text)]">
                  {item.label}
                </div>
                <div className="mt-1 text-[11px] font-semibold text-cyan-700 dark:text-cyan-200">
                  {item.engine}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onCopy(item.prompt)}
                className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-black active:scale-95"
              >
                Copy
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-600 dark:text-[color:var(--muted)]">
              {item.reason}
            </p>
            <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-cyan-100 bg-cyan-50/60 p-3 text-xs leading-relaxed text-slate-700 dark:border-[color:var(--border)] dark:bg-[color:var(--surface-muted)] dark:text-[color:var(--text)]">
              {item.prompt}
            </pre>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
        {scoreCards.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-cyan-100 bg-white/90 p-3 dark:border-[color:var(--border)] dark:bg-[color:var(--surface-elevated)]"
          >
            <div className="text-[11px] font-semibold text-slate-500 dark:text-[color:var(--muted)]">
              {item.label}
            </div>
            <div className={`mt-1 text-xl font-black ${scoreTone(item.value)}`}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-cyan-100 bg-white/90 p-3 dark:border-[color:var(--border)] dark:bg-[color:var(--surface-elevated)]">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-[color:var(--muted)]">
          Prompt QA
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-[color:var(--text)]">
          {report.summary}
        </p>

        {report.warnings.length > 0 ? (
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {report.warnings.map((warning) => (
              <div
                key={`${warning.id}-${warning.title}`}
                className={`rounded-xl border p-3 ${warningTone(warning.severity)}`}
              >
                <div className="text-xs font-black uppercase tracking-[0.16em]">
                  {warning.severity === "danger" ? "Needs fix" : "Review"}
                </div>
                <div className="mt-1 text-sm font-bold">{warning.title}</div>
                <p className="mt-2 text-xs leading-relaxed opacity-90">{warning.detail}</p>
                <p className="mt-2 text-xs font-semibold">Fix: {warning.fix}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-500/12 p-3 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            No prompt QA blockers detected. You can move from the primary prompt into the cinematic route cleanly.
          </div>
        )}
      </div>
    </div>
  );
}

export function TimelineModePanel({
  data,
  onCopy,
}: {
  data: GeneratedPackage;
  onCopy: (text: string) => void | Promise<unknown>;
}) {
  const report = buildPromptClarityReport(data);

  return (
    <div className="rounded-2xl border border-violet-300/40 bg-violet-500/10 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-violet-700 dark:text-violet-200">
            Timeline Mode
          </div>
          <h3 className="mt-1 text-base font-black text-slate-900 dark:text-[color:var(--text)]">
            6-second micro-beat planning for the hybrid route
          </h3>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600 dark:text-[color:var(--muted)]">
            Use these as beat anchors only. Actual generation duration stays in the shot labels, while the timeline guide keeps each segment on one readable action.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {report.timelineMode.map((shot) => {
          const copyText = [
            `${shot.title} — ${shot.engine}`,
            shot.generationDurationLabel,
            shot.editTimelineLabel,
            ...shot.segments.map((segment) => `${segment.window} ${segment.label}: ${segment.text}`),
          ].join("\n");

          return (
            <div
              key={`${shot.title}-${shot.engine}`}
              className="rounded-xl border border-violet-200 bg-white/95 p-3 dark:border-[color:var(--border)] dark:bg-[color:var(--surface-elevated)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black text-slate-900 dark:text-[color:var(--text)]">
                    {shot.title}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-violet-700 dark:text-violet-200">
                    {shot.engine}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onCopy(copyText)}
                  className="rounded-lg border border-violet-200 bg-violet-500/12 px-2.5 py-1 text-[11px] font-bold text-violet-800 hover:bg-violet-500/18 active:scale-95 dark:text-violet-100"
                >
                  Copy guide
                </button>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/12 dark:text-violet-200">
                  {shot.generationDurationLabel}
                </span>
                <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/12 dark:text-violet-200">
                  {shot.editTimelineLabel}
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {shot.segments.map((segment) => (
                  <div
                    key={`${shot.title}-${segment.window}`}
                    className="rounded-lg border border-violet-100 bg-violet-50/60 p-2 dark:border-[color:var(--border)] dark:bg-[color:var(--surface-muted)]"
                  >
                    <div className="text-[11px] font-black uppercase tracking-[0.14em] text-violet-700 dark:text-violet-200">
                      {segment.window} · {segment.label}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-[color:var(--text)]">
                      {segment.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
