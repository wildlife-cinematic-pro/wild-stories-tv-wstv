"use client";

import { getKlingNative15sCard, getKlingSixShotCard, getSeedanceMultiShotCard } from "@/components/output-cards/prompt-utils";

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
  const hasSeedanceDirect =
    data.seedanceMultiShotPrompt !== undefined &&
    data.seedanceMultiShotPrompt !== null;
  const hasKling15Direct =
    data.klingNative15s !== undefined && data.klingNative15s !== null;
  const hasKling6Direct =
    data.klingSixShot !== undefined && data.klingSixShot !== null;

  const resolvedDirectWorkspace: DirectWorkspaceTab =
    directWorkspace === "seedance" && hasSeedanceDirect
      ? "seedance"
      : directWorkspace === "kling15" && hasKling15Direct
        ? "kling15"
        : directWorkspace === "kling6" && hasKling6Direct
          ? "kling6"
          : hasSeedanceDirect
            ? "seedance"
            : hasKling15Direct
              ? "kling15"
              : "kling6";

  const seedanceMultiShotCard = getSeedanceMultiShotCard(data);
  const klingNative15sCard = getKlingNative15sCard(data);
  const klingSixShotCard = getKlingSixShotCard(data);

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
                Kling 15s Optional
              </button>
            )}
            {data.klingSixShot && (
              <button
                type="button"
                onClick={() => onDirectWorkspaceChange("kling6")}
                className={`rounded-xl border px-3 py-2 text-xs font-extrabold ${
                  resolvedDirectWorkspace === "kling6"
                    ? "border-indigo-700 bg-indigo-700 text-white"
                    : "border-indigo-200 bg-[color:var(--surface-elevated)] text-indigo-800 hover:bg-indigo-500/12 dark:text-indigo-100"
                }`}
              >
                Kling 6-Shot Optional
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
                📋 Copy BODY Only
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
                  Kling 15-Second Native Multi-Shot
                </div>

                <span className="rounded-full bg-[color:var(--surface-elevated)] px-2 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200 dark:text-blue-200">
                  Kling 3.0 Pro / Standard
                </span>

                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-extrabold text-green-700 ring-1 ring-green-200 dark:bg-green-500/15 dark:text-green-100">
                  ✓ Zero inter-clip drift
                </span>

                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-100">
                  Action-ready | Audio-capable
                </span>
              </div>
            </div>

            <p className="mb-3 text-xs leading-relaxed text-blue-800 dark:text-blue-100/90">
              यो एउटै prompt Kling 3.0 Pro/Standard मा paste गर्दा 15 seconds
              को continuous video आउँछ। 3 अलग shots generate हुन्छन्, Bind
              Subject / element references use गर्दा subject continuity
              reinforce गर्न सकिन्छ।
            </p>

            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-blue-200 bg-[color:var(--surface-elevated)] p-3 text-xs leading-relaxed text-[color:var(--text)]">
              {klingNative15sCard.fullText}
            </pre>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onCopy(klingNative15sCard.fullText)}
                className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-extrabold text-white hover:bg-blue-800 active:scale-[0.98]"
              >
                📋 Copy Full 15s Prompt
              </button>
              <button
                type="button"
                onClick={() => onCopy(klingNative15sCard.pasteReady)}
                className="rounded-xl border border-blue-300 bg-[color:var(--surface-elevated)] px-4 py-2 text-sm font-extrabold text-blue-700 hover:bg-blue-500/12 active:scale-[0.98] dark:text-blue-100"
              >
                📋 Copy BODY Only
              </button>
            </div>
          </div>
        )}

      {resolvedDirectWorkspace === "kling6" &&
        data.klingSixShot !== undefined &&
        data.klingSixShot !== null && (
          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/12 p-4 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-extrabold text-indigo-900 dark:text-indigo-100">
                  Kling 6-Shot Multi-Scene
                </div>

                <span className="rounded-full bg-[color:var(--surface-elevated)] px-2 py-0.5 text-[11px] font-bold text-indigo-700 ring-1 ring-indigo-200 dark:text-indigo-200">
                  Kling 3.0 Pro / Standard
                </span>

                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-extrabold text-green-700 ring-1 ring-green-200 dark:bg-green-500/15 dark:text-green-100">
                  ✓ 6 shots — 1 prompt
                </span>

                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-800 ring-1 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-100">
                  Current WSTV workflow
                </span>
              </div>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-indigo-800 dark:text-indigo-100/90">
              <span className="font-extrabold">WSTV multi-shot flow:</span>{" "}
              Opening tension → Pressure hold → Profile pressure → Tension
              reaction cut → Action pressure wide → Resolved tension wide. एकै
              prompt ले 6 cinematic shots generate गर्छ — subject identity सबै
              shots मा locked हुन्छ, and the opening starts with clearer
              full-subject readability.
            </p>

            <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl border border-indigo-200 bg-[color:var(--surface-elevated)] p-3 text-xs leading-relaxed text-[color:var(--text)]">
              {klingSixShotCard.fullText}
            </pre>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onCopy(klingSixShotCard.fullText)}
                className="rounded-xl bg-indigo-700 px-4 py-2 text-sm font-extrabold text-white hover:bg-indigo-800 active:scale-[0.98]"
              >
                📋 Copy Full 6-Shot Prompt
              </button>
              <button
                type="button"
                onClick={() => onCopy(klingSixShotCard.pasteReady)}
                className="rounded-xl border border-indigo-300 bg-[color:var(--surface-elevated)] px-4 py-2 text-sm font-extrabold text-indigo-700 hover:bg-indigo-500/12 active:scale-[0.98] dark:text-indigo-100"
              >
                📋 Copy BODY Only
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
