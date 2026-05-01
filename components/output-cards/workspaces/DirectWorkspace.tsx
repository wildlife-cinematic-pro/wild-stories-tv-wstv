"use client";

import {
  getKlingFramesPromptCard,
  getKlingMultishotPromptCards,
  getSeedanceMultiShotCard,
} from "@/components/output-cards/prompt-utils";

import type { GeneratedPackage } from "@/types";
import type { DirectWorkspaceTab } from "@/components/output-cards/workspaces/types";

function CountPill({ label, count, limit }: { label: string; count: number; limit: number }) {
  const pass = count <= limit;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ring-1 ${
        pass
          ? "bg-green-100 text-green-700 ring-green-200 dark:bg-green-500/15 dark:text-green-100"
          : "bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-100"
      }`}
    >
      {label}: {count}/{limit} {pass ? "pass" : "over"}
    </span>
  );
}

export function DirectWorkspace({
  data,
  directWorkspace,
  onDirectWorkspaceChange,
  onCopy,
}: {
  data: GeneratedPackage;
  directWorkspace: DirectWorkspaceTab;
  onDirectWorkspaceChange: (value: DirectWorkspaceTab) => void;
  onCopy: (text: string) => void | Promise<unknown>;
}) {
  const hasKlingFrames =
    data.klingFramesPrompt !== undefined || data.klingNative15s !== undefined;

  const resolvedDirectWorkspace: DirectWorkspaceTab =
    directWorkspace === "kling15" && hasKlingFrames
      ? "kling15"
      : "seedance";

  const seedanceMultiShotCard = getSeedanceMultiShotCard(data);
  const klingFramesCard = getKlingFramesPromptCard(data);
  const klingMultishotCards = getKlingMultishotPromptCards(data);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--surface-shadow)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold text-[color:var(--text)]">
              Direct prompt workspace
            </div>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[color:var(--muted)]">
              One-click direct prompts live here. Kling now separates the single Frames prompt from the 4-shot Multishot prompts so each field stays inside its own model limit.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {data.seedanceMultiShotPrompt && (
              <button
                type="button"
                onClick={() => onDirectWorkspaceChange("seedance")}
                className={`rounded-xl border px-3 py-2 text-xs font-extrabold ${
                  resolvedDirectWorkspace === "seedance"
                    ? "border-orange-700 bg-orange-700 text-white"
                    : "border-orange-200 bg-[color:var(--surface-elevated)] text-orange-800 hover:bg-orange-500/12 dark:text-orange-100"
                }`}
              >
                Seedance 2.0
              </button>
            )}
            {hasKlingFrames && (
              <button
                type="button"
                onClick={() => onDirectWorkspaceChange("kling15")}
                className={`rounded-xl border px-3 py-2 text-xs font-extrabold ${
                  resolvedDirectWorkspace === "kling15"
                    ? "border-blue-700 bg-blue-700 text-white"
                    : "border-blue-200 bg-[color:var(--surface-elevated)] text-blue-800 hover:bg-blue-500/12 dark:text-blue-100"
                }`}
              >
                Kling Frames + Multishot
              </button>
            )}
          </div>
        </div>
      </div>

      {resolvedDirectWorkspace === "seedance" &&
        data.seedanceMultiShotPrompt !== undefined &&
        data.seedanceMultiShotPrompt !== null && (
          <div className="rounded-2xl border border-orange-500/30 bg-orange-500/12 p-4 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <div className="text-sm font-extrabold text-orange-900 dark:text-orange-100">
                Seedance 2.0 Direct Multi-Shot
              </div>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-extrabold text-green-700 ring-1 ring-green-200 dark:bg-green-500/15 dark:text-green-100">
                4 shots - 1 prompt
              </span>
            </div>

            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-orange-200 bg-[color:var(--surface-elevated)] p-3 text-xs leading-relaxed text-[color:var(--text)]">
              {seedanceMultiShotCard.fullText}
            </pre>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onCopy(seedanceMultiShotCard.fullText)}
                className="rounded-xl bg-orange-700 px-4 py-2 text-sm font-extrabold text-white hover:bg-orange-800 active:scale-[0.98]"
              >
                Copy Full Seedance Prompt
              </button>
              <button
                type="button"
                onClick={() => onCopy(seedanceMultiShotCard.pasteReady)}
                className="rounded-xl border border-orange-300 bg-[color:var(--surface-elevated)] px-4 py-2 text-sm font-extrabold text-orange-700 hover:bg-orange-500/12 active:scale-[0.98] dark:text-orange-100"
              >
                Copy Paste-Ready Seedance Prompt
              </button>
            </div>
          </div>
        )}

      {resolvedDirectWorkspace === "kling15" && hasKlingFrames && (
        <div className="space-y-4 rounded-2xl border border-blue-500/30 bg-blue-500/12 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-extrabold text-blue-900 dark:text-blue-100">
              Kling Frames Prompt
            </div>
            <CountPill label="Frames" count={klingFramesCard.pasteReady.length} limit={2500} />
            <span className="rounded-full bg-[color:var(--surface-elevated)] px-2 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200 dark:text-blue-200">
              single prompt field
            </span>
          </div>

          <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-xl border border-blue-200 bg-[color:var(--surface-elevated)] p-3 text-xs leading-relaxed text-[color:var(--text)]">
            {klingFramesCard.fullText}
          </pre>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onCopy(klingFramesCard.pasteReady)}
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-extrabold text-white hover:bg-blue-800 active:scale-[0.98]"
            >
              Copy Kling Frames Prompt
            </button>
            <button
              type="button"
              onClick={() => onCopy(klingFramesCard.fullText)}
              className="rounded-xl border border-blue-300 bg-[color:var(--surface-elevated)] px-4 py-2 text-sm font-extrabold text-blue-700 hover:bg-blue-500/12 active:scale-[0.98] dark:text-blue-100"
            >
              Copy Frames Card + Notes
            </button>
          </div>

          <div className="rounded-2xl border border-blue-300/60 bg-[color:var(--surface-elevated)] p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="text-sm font-extrabold text-blue-900 dark:text-blue-100">
                Kling Multishot 4-Shot Prompts
              </div>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-extrabold text-green-700 ring-1 ring-green-200 dark:bg-green-500/15 dark:text-green-100">
                exactly 4 shots
              </span>
              {klingMultishotCards.map((card, index) => (
                <CountPill key={card.metadata?.shotKey ?? index} label={`Shot ${index + 1}`} count={card.pasteReady.length} limit={512} />
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              {klingMultishotCards.map((card, index) => (
                <div key={card.metadata?.shotKey ?? index} className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 dark:border-[color:var(--border)] dark:bg-[color:var(--surface-muted)]">
                  <div className="mb-2 text-xs font-black text-blue-900 dark:text-blue-100">
                    Shot {index + 1}: {card.pasteReady.length}/512
                  </div>
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-[color:var(--text)]">
                    {card.pasteReady}
                  </pre>
                  <button
                    type="button"
                    onClick={() => onCopy(card.pasteReady)}
                    className="mt-3 rounded-lg border border-blue-300 bg-[color:var(--surface-elevated)] px-3 py-1.5 text-xs font-extrabold text-blue-800 hover:bg-blue-500/12 active:scale-[0.98] dark:text-blue-100"
                  >
                    Copy Shot {index + 1}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
