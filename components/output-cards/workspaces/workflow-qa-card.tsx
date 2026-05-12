"use client";

import { getWorkflowQAForRoute } from "@/lib/video-workflow-qa";
import type {
  ModelSpecificPromptGuidanceInfo,
  PrimaryVideoRouteInfo,
} from "@/types";

export function WorkflowQACard({
  route,
  guidance,
  onCopy,
}: {
  route?: PrimaryVideoRouteInfo;
  guidance?: ModelSpecificPromptGuidanceInfo;
  onCopy: (text: string) => void | Promise<unknown>;
}) {
  const workflowQA = getWorkflowQAForRoute({ route, guidance });

  return (
    <div className="mt-3 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[color:var(--muted)]">
            Workflow QA
          </div>
          <div className="mt-1 text-xs font-extrabold text-[color:var(--text)]">
            {workflowQA.primaryRoute}
          </div>
          <p className="mt-1 text-[11px] font-semibold text-[color:var(--muted)]">
            Selected Model: {workflowQA.selectedModel}
          </p>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${
            workflowQA.status === "Ready"
              ? "border-emerald-500/40 bg-emerald-500/12 text-emerald-800 dark:text-emerald-100"
              : workflowQA.status === "Needs attention"
                ? "border-amber-500/40 bg-amber-500/12 text-amber-800 dark:text-amber-100"
                : "border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--muted)]"
          }`}
        >
          {workflowQA.status}
        </span>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[color:var(--muted)]">
            Required Inputs
          </div>
          <ul className="mt-2 space-y-1.5 text-xs font-semibold leading-relaxed text-[color:var(--text)]">
            {workflowQA.requiredInputs.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[color:var(--muted)]">
            Warnings
          </div>
          {workflowQA.warnings.length ? (
            <ul className="mt-2 space-y-1.5 text-xs font-semibold leading-relaxed text-[color:var(--text)]">
              {workflowQA.warnings.map((warning) => (
                <li key={warning} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs font-semibold text-[color:var(--muted)]">
              No route-specific warnings.
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-2 text-xs font-semibold text-[color:var(--text)]">
        <span className="font-extrabold">Best Next Action:</span>{" "}
        {workflowQA.bestNextAction}
      </div>

      <button
        type="button"
        onClick={() => onCopy(workflowQA.copyText)}
        className="mt-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-1.5 text-xs font-extrabold text-[color:var(--text)] hover:bg-[color:var(--surface)] active:scale-95"
      >
        Copy Workflow QA
      </button>
    </div>
  );
}
