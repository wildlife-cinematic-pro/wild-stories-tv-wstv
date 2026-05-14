"use client";

import {
  getKlingFramesPromptCard,
  getKlingMultishotPromptCards,
  getSeedanceMultiShotCard,
} from "@/components/output-cards/prompt-utils";

import type { GeneratedPackage, StructuredPrompt } from "@/types";
import type { DirectWorkspaceTab } from "@/components/output-cards/workspaces/types";
import { resolveDirectWorkspaceTab } from "@/components/output-cards/workspaces/direct-workspace-utils";

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


type KlingCombinedPromptInfo = {
  combinedPrompt: string;
  totalChars: number;
  withinLimit: boolean;
};

function getKlingCombinedPromptInfo(
  card: StructuredPrompt
): KlingCombinedPromptInfo | null {
  const settings = card.settings ?? [];
  const combinedLine = settings.find((line) =>
    line.toLowerCase().startsWith("combined prompt chars:")
  );
  const withinLimitLine = settings.find((line) =>
    line.toLowerCase().startsWith("within 2500-char limit:")
  );

  if (!combinedLine || !withinLimitLine || !card.pasteReady.includes("Negative prompt:")) {
    return null;
  }

  const totalChars = Number.parseInt(
    combinedLine.replace(/^Combined prompt chars:\s*/i, ""),
    10
  );
  const withinLimit = /yes/i.test(withinLimitLine);

  if (!Number.isFinite(totalChars)) {
    return null;
  }

  return {
    combinedPrompt: card.pasteReady,
    totalChars,
    withinLimit,
  };
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
  const seedanceMultiShotCard = getSeedanceMultiShotCard(data);
  const klingFramesCard = getKlingFramesPromptCard(data);
  const klingMultishotCards = getKlingMultishotPromptCards(data);
  const hasSeedance = Boolean(data.seedanceMultiShotPrompt);
  const hasKlingFrames = Boolean(data.klingFramesPrompt ?? data.klingNative15s);
  const hasKlingDirect = hasKlingFrames || klingMultishotCards.length > 0;
  const resolvedDirectWorkspace = resolveDirectWorkspaceTab({
    selected: directWorkspace,
    hasKlingDirect,
    hasSeedance,
  });
  const klingCombinedPromptInfo = hasKlingFrames
    ? getKlingCombinedPromptInfo(klingFramesCard)
    : null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--surface-shadow)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold text-[color:var(--text)]">
              Direct prompt workspace
            </div>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[color:var(--muted)]">
              One-click direct prompts live here. Kling separates the single Frames prompt from the 3-shot Multishot prompts so each field stays inside its own model limit.
            </p>
          </div>

          <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            {hasSeedance && (
              <button
                type="button"
                onClick={() => onDirectWorkspaceChange("seedance")}
                className={`w-full rounded-xl border px-3 py-2 text-xs font-extrabold sm:w-auto ${
                  resolvedDirectWorkspace === "seedance"
                    ? "border-orange-700 bg-orange-700 text-white"
                    : "border-orange-200 bg-[color:var(--surface-elevated)] text-orange-800 hover:bg-orange-500/12 dark:text-orange-100"
                }`}
              >
                Seedance 2.0
              </button>
            )}
            {hasKlingDirect && (
              <button
                type="button"
                onClick={() => onDirectWorkspaceChange("kling15")}
                className={`w-full rounded-xl border px-3 py-2 text-xs font-extrabold sm:w-auto ${
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

      {resolvedDirectWorkspace === null && (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 text-sm font-bold text-[color:var(--muted)]">
          No direct prompts are available for this package yet.
        </div>
      )}

      {resolvedDirectWorkspace === "seedance" &&
        data.seedanceMultiShotPrompt !== undefined &&
        data.seedanceMultiShotPrompt !== null && (
          <div className="rounded-2xl border border-orange-500/30 bg-orange-500/12 p-4 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <div className="text-sm font-extrabold text-orange-900 dark:text-orange-100">
                Seedance Direct 15s Multishot
              </div>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-extrabold text-green-700 ring-1 ring-green-200 dark:bg-green-500/15 dark:text-green-100">
                3 shots - 15s direct prompt
              </span>
            </div>

            <div className="rounded-xl border border-orange-200 bg-[color:var(--surface-elevated)] p-3">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-orange-800 ring-1 ring-orange-200 dark:bg-orange-500/15 dark:text-orange-100">
                  PASTE THIS INTO SEEDANCE
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-orange-800 dark:text-orange-100/90">
                  Paste-ready prompt only
                </span>
              </div>
              <pre className="max-w-full whitespace-pre-wrap break-words text-xs leading-relaxed text-[color:var(--text)] [overflow-wrap:anywhere]">
                {seedanceMultiShotCard.pasteReady}
              </pre>
            </div>

            <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
              <button
                type="button"
                onClick={() => onCopy(seedanceMultiShotCard.pasteReady)}
                className="w-full rounded-xl bg-orange-700 px-4 py-2 text-sm font-extrabold text-white hover:bg-orange-800 active:scale-[0.98] sm:w-auto"
              >
                Copy Seedance Direct Prompt
              </button>
              <button
                type="button"
                onClick={() => onCopy(seedanceMultiShotCard.fullText)}
                className="w-full rounded-xl border border-orange-300 bg-[color:var(--surface-elevated)] px-4 py-2 text-sm font-extrabold text-orange-700 hover:bg-orange-500/12 active:scale-[0.98] dark:text-orange-100 sm:w-auto"
              >
                Copy Full Reference
              </button>
            </div>

            <details className="mt-3 rounded-xl border border-orange-200 bg-[color:var(--surface-elevated)] p-3">
              <summary className="cursor-pointer text-xs font-extrabold uppercase tracking-wide text-orange-800 dark:text-orange-100">
                REFERENCE / FULL CARD
              </summary>
              <pre className="mt-2 max-w-full whitespace-pre-wrap break-words border-t border-orange-200 pt-2 text-xs leading-relaxed text-[color:var(--text)] [overflow-wrap:anywhere]">
                {seedanceMultiShotCard.fullText}
              </pre>
            </details>
          </div>
        )}

      {resolvedDirectWorkspace === "kling15" && hasKlingDirect && (
        <div className="space-y-4 rounded-2xl border border-blue-500/30 bg-blue-500/12 p-4 shadow-sm">
          {hasKlingFrames && (
            <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-extrabold text-blue-900 dark:text-blue-100">
              Kling Frames Prompt
            </div>
            <CountPill label="Frames" count={klingFramesCard.pasteReady.length} limit={2500} />
            <span className="rounded-full bg-[color:var(--surface-elevated)] px-2 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200 dark:text-blue-200">
              single prompt field
            </span>
          </div>

          <div className="rounded-xl border border-blue-200 bg-[color:var(--surface-elevated)] p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-blue-800 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-100">
                PASTE THIS INTO KLING FRAMES
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-blue-800 dark:text-blue-100/90">
                Single prompt field
              </span>
            </div>
            <pre className="max-w-full whitespace-pre-wrap break-words text-xs leading-relaxed text-[color:var(--text)] [overflow-wrap:anywhere]">
              {klingFramesCard.pasteReady}
            </pre>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => onCopy(klingFramesCard.pasteReady)}
              className="w-full rounded-xl bg-blue-700 px-4 py-2 text-sm font-extrabold text-white hover:bg-blue-800 active:scale-[0.98] sm:w-auto"
            >
              Copy Kling Frames Prompt
            </button>
            <button
              type="button"
              onClick={() => onCopy(klingFramesCard.fullText)}
              className="w-full rounded-xl border border-blue-300 bg-[color:var(--surface-elevated)] px-4 py-2 text-sm font-extrabold text-blue-700 hover:bg-blue-500/12 active:scale-[0.98] dark:text-blue-100 sm:w-auto"
            >
              Copy Full Reference
            </button>
          </div>

          <details className="rounded-xl border border-blue-200 bg-[color:var(--surface-elevated)] p-3">
            <summary className="cursor-pointer text-xs font-extrabold uppercase tracking-wide text-blue-800 dark:text-blue-100">
              REFERENCE / FULL CARD
            </summary>
            <pre className="mt-2 max-w-full whitespace-pre-wrap break-words border-t border-blue-200 pt-2 text-xs leading-relaxed text-[color:var(--text)] [overflow-wrap:anywhere]">
              {klingFramesCard.fullText}
            </pre>
          </details>

          </>
          )}

          {klingCombinedPromptInfo && (
            <div className="rounded-xl border border-blue-300/60 bg-[color:var(--surface-elevated)] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-extrabold text-blue-900 dark:text-blue-100">
                  Kling 15s Combined Prompt
                </div>
                <CountPill
                  label="Chars"
                  count={klingCombinedPromptInfo.totalChars}
                  limit={2500}
                />
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ring-1 ${
                    klingCombinedPromptInfo.withinLimit
                      ? "bg-green-100 text-green-700 ring-green-200 dark:bg-green-500/15 dark:text-green-100"
                      : "bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-100"
                  }`}
                >
                  Status: {klingCombinedPromptInfo.withinLimit ? "pass" : "over"}
                </span>
                <span className="rounded-full bg-[color:var(--surface-muted)] px-2 py-0.5 text-[11px] font-bold text-[color:var(--muted)] ring-1 ring-[color:var(--border)]">
                  Includes negative prompt
                </span>
              </div>

              <div className="mt-3 grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
                <div className="text-xs leading-relaxed text-[color:var(--muted)]">
                  Character count: {klingCombinedPromptInfo.totalChars}/2500
                </div>
                <button
                  type="button"
                  onClick={() => onCopy(klingCombinedPromptInfo.combinedPrompt)}
                  className="w-full rounded-xl border border-blue-300 bg-[color:var(--surface-elevated)] px-4 py-2 text-sm font-extrabold text-blue-700 hover:bg-blue-500/12 active:scale-[0.98] dark:text-blue-100 sm:w-auto"
                >
                  Copy exact Kling paste-ready prompt
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-blue-300/60 bg-[color:var(--surface-elevated)] p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className="text-sm font-extrabold text-blue-900 dark:text-blue-100">
                Kling Multishot 3-Shot Prompts
              </div>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-extrabold text-green-700 ring-1 ring-green-200 dark:bg-green-500/15 dark:text-green-100">
                {klingMultishotCards.length === 3 ? "exactly 3 shots" : `${klingMultishotCards.length} saved shots`}
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
                  <pre className="max-w-full whitespace-pre-wrap break-words text-xs leading-relaxed text-[color:var(--text)] [overflow-wrap:anywhere]">
                    {card.pasteReady}
                  </pre>
                  <button
                    type="button"
                    onClick={() => onCopy(card.pasteReady)}
                    className="mt-3 w-full rounded-lg border border-blue-300 bg-[color:var(--surface-elevated)] px-3 py-1.5 text-xs font-extrabold text-blue-800 hover:bg-blue-500/12 active:scale-[0.98] dark:text-blue-100 sm:w-auto"
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
