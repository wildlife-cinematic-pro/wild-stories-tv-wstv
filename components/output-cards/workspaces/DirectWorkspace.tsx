"use client";

import { getKlingNative15sCard, getSeedanceMultiShotCard } from "@/components/output-cards/prompt-utils";

import type { GeneratedPackage } from "@/types";
import type { DirectWorkspaceTab } from "@/components/output-cards/workspaces/types";

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
  const hasKling15Direct =
    data.klingNative15s !== undefined && data.klingNative15s !== null;

  const resolvedDirectWorkspace: DirectWorkspaceTab =
    directWorkspace === "kling15" && hasKling15Direct
      ? "kling15"
      : "seedance";

  const seedanceMultiShotCard = getSeedanceMultiShotCard(data);
  const klingNative15sCard = getKlingNative15sCard(data);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--surface-shadow)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold text-[color:var(--text)]">
              Direct prompt workspace
            </div>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[color:var(--muted)]">
              One-click multi-shot prompts live here. Seedance 2.0 stays
              available as an optional direct 4-shot bundle, while Kling formats
              remain optional alternate / extended prompt formats.
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
            {data.klingNative15s && (
              <button
                type="button"
                onClick={() => onDirectWorkspaceChange("kling15")}
                className={`rounded-xl border px-3 py-2 text-xs font-extrabold ${
                  resolvedDirectWorkspace === "kling15"
                    ? "border-blue-700 bg-blue-700 text-white"
                    : "border-blue-200 bg-[color:var(--surface-elevated)] text-blue-800 hover:bg-blue-500/12 dark:text-blue-100"
                }`}
              >
                Kling Direct 15s
              </button>
            )}

          </div>
        </div>
      </div>

      {resolvedDirectWorkspace === "seedance" &&
        data.seedanceMultiShotPrompt !== undefined &&
        data.seedanceMultiShotPrompt !== null && (
          <div className="rounded-2xl border border-orange-500/30 bg-orange-500/12 p-4 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-extrabold text-orange-900 dark:text-orange-100">
                  Seedance 2.0 Direct Multi-Shot
                </div>

                <span className="rounded-full bg-[color:var(--surface-elevated)] px-2 py-0.5 text-[11px] font-bold text-orange-700 ring-1 ring-orange-200 dark:text-orange-200">
                  Seedance 2.0
                </span>

                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-extrabold text-green-700 ring-1 ring-green-200 dark:bg-green-500/15 dark:text-green-100">
                  ✓ 4 shots — 1 prompt
                </span>

                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-100">
                  Prompt + First Frame
                </span>
              </div>
            </div>

            <p className="mb-3 text-xs leading-relaxed text-orange-800 dark:text-orange-100/90">
              यो Kling ko direct multi-shot pane जस्तै Seedance 2.0 ko लागि हो.
              एउटै continuity prompt लाई direct paste गर्न मिल्छ. Current WSTV
              flow मा 4 linked shots छन्: opening tension → pressure build →
              peak action → resolved tension. Best result ka lagi `Prompt` +
              `First Frame` base राख्नुस्, ani चाहियो भने मात्र `Ref Image` /
              `Ref Video` थप्नुस्.
            </p>

            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-orange-200 bg-[color:var(--surface-elevated)] p-3 text-xs leading-relaxed text-[color:var(--text)]">
              {seedanceMultiShotCard.fullText}
            </pre>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onCopy(seedanceMultiShotCard.fullText)}
                className="rounded-xl bg-orange-700 px-4 py-2 text-sm font-extrabold text-white hover:bg-orange-800 active:scale-[0.98]"
              >
                📋 Copy Full Seedance Prompt
              </button>
              <button
                type="button"
                onClick={() => onCopy(seedanceMultiShotCard.pasteReady)}
                className="rounded-xl border border-orange-300 bg-[color:var(--surface-elevated)] px-4 py-2 text-sm font-extrabold text-orange-700 hover:bg-orange-500/12 active:scale-[0.98] dark:text-orange-100"
              >
                📋 Copy Card + Notes
              </button>
            </div>
          </div>
        )}

      {resolvedDirectWorkspace === "kling15" &&
        data.klingNative15s !== undefined &&
        data.klingNative15s !== null && (
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/12 p-4 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-extrabold text-blue-900 dark:text-blue-100">
                  Kling Direct 15s Multishot
                </div>

                <span className="rounded-full bg-[color:var(--surface-elevated)] px-2 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200 dark:text-blue-200">
                  Kling 3.0 Pro / Standard
                </span>

                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-extrabold text-green-700 ring-1 ring-green-200 dark:bg-green-500/15 dark:text-green-100">
                  ✓ 5 shots — 1 prompt
                </span>

                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-100">
                  Negative prompt embedded
                </span>
              </div>
            </div>

            <p className="mb-3 text-xs leading-relaxed text-blue-800 dark:text-blue-100/90">
              Paste one prompt block into Kling 3.0 Pro or Standard for a full 15-second survival sequence. The copied block preserves the provided master image, keeps all five beats in one place, and ends with the embedded Negative prompt line for faster testing.
            </p>

            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-blue-200 bg-[color:var(--surface-elevated)] p-3 text-xs leading-relaxed text-[color:var(--text)]">
              {klingNative15sCard.fullText}
            </pre>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onCopy(klingNative15sCard.pasteReady)}
                className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-extrabold text-white hover:bg-blue-800 active:scale-[0.98]"
              >
                📋 Copy Kling 15s Prompt
              </button>
              <button
                type="button"
                onClick={() => onCopy(klingNative15sCard.fullText)}
                className="rounded-xl border border-blue-300 bg-[color:var(--surface-elevated)] px-4 py-2 text-sm font-extrabold text-blue-700 hover:bg-blue-500/12 active:scale-[0.98] dark:text-blue-100"
              >
                📋 Copy Card + Notes
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
