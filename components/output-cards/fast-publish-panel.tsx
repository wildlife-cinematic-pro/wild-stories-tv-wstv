"use client";

import { getImagePromptCard, getWorkflowPromptCard } from "@/components/output-cards/prompt-utils";
import { getDurationLaneConfig } from "@/lib/duration-lanes";

import type { GeneratedPackage } from "@/types";

type FastPublishPanelProps = {
  data: GeneratedPackage;
  onCopy: (text: string) => void | Promise<unknown>;
};

function safeStr(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(String).join("\n").trim();
  return String(value ?? "").trim();
}

export function FastPublishPanel({ data, onCopy }: FastPublishPanelProps) {
  const resolvedLane = data.durationLane ?? (data.pipelineStyle === "long-hybrid-4-shot" ? "long" : "short");
  const laneConfig = getDurationLaneConfig(resolvedLane);
  const items = [
    {
      title: "1. Master Image Prompt",
      value: getImagePromptCard(data).pasteReady,
    },
    {
      title: "2. Shot 1 Runway",
      value: getWorkflowPromptCard(data, 0).pasteReady,
    },
    {
      title: "3. Shot 2 Kling",
      value: getWorkflowPromptCard(data, 1).pasteReady,
    },
    {
      title: "4. Shot 3 Kling",
      value: getWorkflowPromptCard(data, 2).pasteReady,
    },
    {
      title: "5. Shot 4 Runway",
      value: getWorkflowPromptCard(data, 3).pasteReady,
    },
    {
      title: "6. Caption",
      value: safeStr(data.platformPack?.facebook.caption ?? data.caption),
    },
    {
      title: "7. 5 Hashtags",
      value: safeStr(data.platformPack?.facebook.hashtags ?? data.hashtags),
    },
  ].filter((item) => item.value);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm shadow-slate-200/60 dark:border-[color:var(--border)] dark:bg-[color:var(--surface-elevated)] dark:shadow-[var(--surface-shadow)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
            Fast Publish
          </div>
          <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-[color:var(--text)]">
            Daily copy-ready essentials
          </h3>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600 dark:text-[color:var(--muted)]">
            Master still, the core hybrid shots, the Facebook caption, and the 5-tag pack stay here so the daily WSTV publish path stays fast.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-white">
            {laneConfig.shortLabel.toUpperCase()}
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700 dark:border-[color:var(--border)] dark:bg-[color:var(--surface-muted)] dark:text-[color:var(--muted)]">
            {laneConfig.routeTimingLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-[color:var(--border)] dark:bg-[color:var(--surface-muted)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-extrabold text-slate-900 dark:text-[color:var(--text)]">
                {item.title}
              </div>
              <button
                type="button"
                onClick={() => onCopy(item.value)}
                className="rounded-lg bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-black active:scale-95"
              >
                Copy
              </button>
            </div>
            <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-700 dark:text-[color:var(--muted)]">
              {item.value}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
