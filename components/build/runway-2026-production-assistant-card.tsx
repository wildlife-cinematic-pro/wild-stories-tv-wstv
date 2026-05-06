"use client";

import type { Runway2026AssistantPack } from "@/lib/runway-2026-production-assistant";

type Runway2026ProductionAssistantCardProps = {
  pack: Runway2026AssistantPack;
  onCopy: (label: string, text: string) => void;
  copyFeedback?: string | null;
};

const TOP_ACTIONS = [
  { label: "Gen-4.5 I2V Plan", key: "gen45I2VPlan" },
  { label: "Aleph 5s Repair", key: "alephRepairGuide" },
  { label: "Workflow Blueprint", key: "workflowBlueprint" },
  { label: "15s Reel Route", key: "reelRoute" },
] as const;

const PROMPT_WRITER_ACTIONS = [
  { label: "Runway I2V Prompt", key: "runwayI2VPrompt" },
  { label: "Reference Image Prompt", key: "referenceImagePrompt" },
  { label: "Final Merge Prompt", key: "finalMergePrompt" },
  { label: "Aleph Repair Prompt", key: "alephRepairPrompt" },
  { label: "15s Reel Prompt", key: "reelPrompt" },
] as const;

export default function Runway2026ProductionAssistantCard({
  pack,
  onCopy,
  copyFeedback,
}: Runway2026ProductionAssistantCardProps) {
  const isAssistantCopyFeedbackVisible =
    copyFeedback != null &&
    [...TOP_ACTIONS.map((action) => action.label), ...PROMPT_WRITER_ACTIONS.map((action) => action.label)].some(
      (label) => copyFeedback === label
    );

  return (
    <div className="mb-4 min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/60 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Runway 2026 Production Assistant
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            Gen-4.5 motion-first, Aleph repair, Workflow blueprint, 15s route
          </div>
          <div className="mt-1 text-xs leading-relaxed text-slate-500">
            Copy-only helper. Nothing is sent to Runway.
          </div>
        </div>
        {isAssistantCopyFeedbackVisible && (
          <div className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-white">
            {copyFeedback} copied
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {TOP_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => onCopy(action.label, pack[action.key])}
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-left text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
          >
            Copy {action.label}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-900">
          Prompt Writer
        </div>
        <div className="mt-1 text-xs leading-relaxed text-slate-600">
          Paste-ready prompts built from the current generated package.
        </div>

        <div className="mt-3 grid gap-2">
          {PROMPT_WRITER_ACTIONS.map((action, index) => {
            const isPrimary = index === 0;

            return (
              <button
                key={action.label}
                type="button"
                onClick={() => onCopy(action.label, pack.promptWriter[action.key])}
                className={`w-full rounded-xl px-3.5 py-2 text-left text-xs font-semibold shadow-sm transition active:scale-[0.98] ${
                  isPrimary
                    ? "bg-slate-900 text-white hover:bg-black"
                    : "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                }`}
              >
                Copy {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
