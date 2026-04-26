"use client";

import { ProShotCard, SectionLabel } from "@/components/output-cards/shared-panels";
import { TimelineModePanel } from "@/components/output-cards/prompt-guidance-panel";
import { getPromptCardForEngine, getWorkflowPromptCard } from "@/components/output-cards/prompt-utils";
import { getDurationLaneConfig } from "@/lib/duration-lanes";

import type { GeneratedPackage } from "@/types";
import type { DirectWorkspaceTab, VideoWorkspaceTab } from "@/components/output-cards/workspaces/types";

function safeStr(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(String).join("\n").trim();
  return String(value ?? "").trim();
}

export function VideoWorkspace({
  data,
  videoWorkspace,
  onVideoWorkspaceChange,
  onOpenDirectWorkspace,
  onOpenWorkspace,
  onCopy,
}: {
  data: GeneratedPackage;
  videoWorkspace: VideoWorkspaceTab;
  onVideoWorkspaceChange: (value: VideoWorkspaceTab) => void;
  onOpenDirectWorkspace: (value: DirectWorkspaceTab) => void;
  onOpenWorkspace: (value: "direct") => void;
  onCopy: (text: string) => void | Promise<unknown>;
}) {
  const runwayShots = (data.runwayShots ?? []).map((shot) => String(shot ?? ""));
  const klingShots = (data.klingShots ?? []).map((shot) => String(shot ?? ""));
  const seedanceShots = (data.seedanceShots ?? []).map((shot) => String(shot ?? ""));
  const runwayPromptCards = runwayShots.map((_, index) =>
    getPromptCardForEngine(data, "runway", index)
  );
  const klingPromptCards = klingShots.map((_, index) =>
    getPromptCardForEngine(data, "kling", index)
  );
  const seedancePromptCards = seedanceShots.map((_, index) =>
    getPromptCardForEngine(data, "seedance", index)
  );
  const resolvedLane =
    data.durationLane ??
    (data.pipelineStyle === "long-hybrid-4-shot" ? "long" : "short");
  const laneConfig = getDurationLaneConfig(resolvedLane);
  const hybridRouteBadge = `${laneConfig.shortLabel.toUpperCase()} • ${laneConfig.totalEditLabel}`;
  const hybridRouteTiming = laneConfig.routeTimingLabel;
  const hybridRouteSummary = laneConfig.summary;
  const primaryShotPlan = (data.shotPlan ?? []).map((item, index) => {
    const title = safeStr(item.title) || `Shot ${index + 1}`;
    const note = title.split("—")[1]?.trim() ?? "";
    const durationLabel = safeStr(item.durationLabel);
    const isRunway = item.engine === "RUNWAY";

    return {
      ...item,
      title,
      note,
      durationLabel,
      generationDurationLabel: safeStr(item.generationDurationLabel),
      editTimelineLabel: safeStr(item.editTimelineLabel),
      promptCard: getWorkflowPromptCard(data, index),
      cardEngine: isRunway ? ("runway" as const) : ("kling" as const),
      engineLabel: isRunway ? "Runway" : "Kling",
      color: isRunway
        ? "border-green-500/30 bg-green-500/12 text-green-900 dark:text-green-100"
        : "border-blue-500/30 bg-blue-500/12 text-blue-900 dark:text-blue-100",
    };
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--surface-shadow)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-extrabold text-[color:var(--text)]">
              Video workspace
            </div>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[color:var(--muted)]">
              {resolvedLane === "long"
                ? "Current package is using the extended long hybrid lane: Runway 10 / Kling 10 / Kling 10 / Runway 10, with optional editor pacing out to 45–50 seconds. Optional Seedance, full Runway, and full Kling bundles still stay below as secondary views."
                : resolvedLane === "medium"
                  ? "Current package is using the medium hybrid lane: Runway 10 / Kling 10 / Kling 10 / Runway 5 for a cleaner 35-second final edit. Optional Seedance, full Runway, and full Kling bundles still stay below as secondary views."
                  : "Default WSTV video setup is the primary hybrid 4-shot path. Seedance 2.0, full Runway 4-shot, and full Kling 4-shot bundles stay available below as optional views."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { key: "hybrid" as const, label: "Hybrid Primary" },
              { key: "seedance" as const, label: "Seedance Optional" },
              { key: "runway" as const, label: "Runway Optional" },
              { key: "kling" as const, label: "Kling Optional" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onVideoWorkspaceChange(item.key)}
                className={`rounded-xl border px-3 py-2 text-xs font-extrabold ${
                  videoWorkspace === item.key
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <SectionLabel label="🎬 Video Shots (Pro Layout)" />

      <TimelineModePanel data={data} onCopy={onCopy} />

      {videoWorkspace === "hybrid" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-violet-500/30 bg-violet-500/12 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-extrabold text-violet-900 dark:text-violet-100">
                {resolvedLane === "long"
                  ? "Primary long hybrid 4-shot route summary"
                  : resolvedLane === "medium"
                    ? "Primary medium hybrid 4-shot route summary"
                    : "Primary hybrid 4-shot route summary"}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[color:var(--surface-elevated)] px-2 py-0.5 text-[11px] font-bold text-violet-700 ring-1 ring-violet-200 dark:text-violet-200">
                  {hybridRouteBadge}
                </span>
                <span className="rounded-full bg-[color:var(--surface-elevated)] px-2 py-0.5 text-[11px] font-bold text-violet-700 ring-1 ring-violet-200 dark:text-violet-200">
                  {hybridRouteTiming}
                </span>
              </div>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-violet-800 dark:text-violet-100/90">
              {hybridRouteSummary}
            </p>

            {laneConfig.optionalFinalEditNote && (
              <div className="mt-3 rounded-xl border border-violet-200 bg-[color:var(--surface-elevated)]/80 px-3 py-2 text-[11px] font-semibold text-violet-700 dark:text-violet-200">
                {laneConfig.optionalFinalEditNote}
              </div>
            )}

            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-violet-500 dark:text-violet-200/80">
              {resolvedLane === "long"
                ? "Continuity-safe long hybrid route preserved"
                : resolvedLane === "medium"
                  ? "Continuity-safe medium hybrid route"
                  : "Continuity-safe hybrid route"}
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {primaryShotPlan.map((item, index) => (
                <div
                  key={`${item.engine}-${item.title}-${index}`}
                  className={`rounded-2xl border p-3 ${item.color}`}
                >
                  <div className="text-[11px] font-black uppercase tracking-wide">
                    {`Shot ${index + 1}`}
                  </div>
                  <div className="mt-2 text-base font-black">{item.engineLabel}</div>
                  <div className="mt-1 text-xs font-medium opacity-80">{item.note}</div>
                  {item.generationDurationLabel && (
                    <div className="mt-2 inline-flex rounded-full bg-[color:var(--surface-elevated)] px-2 py-0.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-200 dark:text-violet-200">
                      {item.generationDurationLabel}
                    </div>
                  )}
                  {item.editTimelineLabel && (
                    <div className="mt-2 inline-flex rounded-full bg-[color:var(--surface-elevated)] px-2 py-0.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-200 dark:text-violet-200">
                      {item.editTimelineLabel}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {primaryShotPlan.map((item, index) => (
              <ProShotCard
                key={`${item.engine}-${item.title}-${index}`}
                engine={item.cardEngine}
                index={index}
                shot={safeStr(item.prompt)}
                prompt={item.promptCard}
                onCopy={onCopy}
              />
            ))}
          </div>
        </div>
      )}

      {videoWorkspace === "seedance" && (
        <div className="rounded-2xl border border-orange-500/30 bg-orange-500/12 p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-extrabold text-orange-900 dark:text-orange-100">
              Seedance Shots
            </div>
            <span className="rounded-full bg-[color:var(--surface-elevated)] px-2 py-0.5 text-[11px] font-bold text-orange-700 ring-1 ring-orange-200 dark:text-orange-200">
              Seedance 2.0 | optional full 4-shot bundle | multimodal refs
            </span>
          </div>

          <p className="mb-3 text-xs text-orange-800 dark:text-orange-100/90">
            Optional full Seedance 2.0 bundle. Base workflow: `Prompt` + `First
            Frame`, then add `Ref Image` or `Ref Video` only when useful.
            Standard Seedance setup here is 4 separate shots at 5 seconds each.
            Keep static description light, describe subject movement +
            background movement + camera movement, and avoid negative prompts.
          </p>

          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onCopy(
                  seedancePromptCards
                    .map((card) => card.pasteReady)
                    .filter(Boolean)
                    .join("\n\n---\n\n")
                )
              }
              className="rounded-lg border border-orange-200 bg-orange-100 px-3 py-1.5 text-xs font-extrabold text-orange-900 hover:bg-orange-200 active:scale-95 dark:bg-orange-500/15 dark:text-orange-100 dark:hover:bg-orange-500/25"
            >
              Copy Seedance Bodies
            </button>

            {data.seedanceMultiShotPrompt && (
              <button
                type="button"
                onClick={() => {
                  onOpenDirectWorkspace("seedance");
                  onOpenWorkspace("direct");
                }}
                className="rounded-lg border border-orange-300 bg-[color:var(--surface-elevated)] px-3 py-1.5 text-xs font-extrabold text-orange-800 hover:bg-orange-500/12 active:scale-95 dark:text-orange-100"
              >
                Open Direct Seedance Prompt
              </button>
            )}
          </div>

          <div className="space-y-3">
            {seedanceShots.map((shot, index) => (
              <ProShotCard
                key={`seedance-pro-${index}`}
                engine="seedance"
                index={index}
                shot={shot}
                prompt={getPromptCardForEngine(data, "seedance", index)}
                onCopy={onCopy}
              />
            ))}
          </div>
        </div>
      )}

      {videoWorkspace === "runway" && (
        <div className="rounded-2xl border border-green-500/30 bg-green-500/12 p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-sm font-extrabold text-green-900 dark:text-green-100">
              Runway Shots
            </div>
            <span className="rounded-full bg-[color:var(--surface-elevated)] px-2 py-0.5 text-[11px] font-bold text-green-700 ring-1 ring-green-200 dark:text-green-200">
              Gen-4.5 | 24/25fps | 720p
            </span>
          </div>

          <p className="mb-3 text-xs text-green-800 dark:text-green-100/90">
            Optional full Runway 4-shot bundle. It supports opening tension,
            pressure build, peak action, and resolved tension. In the hybrid
            route, Runway is used for Shot 1 and Shot 4.
          </p>

          <p className="mb-3 text-xs text-green-800 dark:text-green-100/90">
            I2V = motion only. No negative prompts. Last-frame chaining is
            recommended only when the outgoing frame remains a clean full-body
            handoff frame.
          </p>

          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onCopy(
                  runwayPromptCards
                    .map((card) => card.pasteReady)
                    .filter(Boolean)
                    .join("\n\n---\n\n")
                )
              }
              className="rounded-lg border border-green-200 bg-green-100 px-3 py-1.5 text-xs font-extrabold text-green-900 hover:bg-green-200 active:scale-95 dark:bg-green-500/15 dark:text-green-100 dark:hover:bg-green-500/25"
            >
              Copy Runway Bodies
            </button>
          </div>

          <div className="space-y-3">
            {runwayShots.map((shot, index) => (
              <ProShotCard
                key={`runway-pro-${index}`}
                engine="runway"
                index={index}
                shot={shot}
                prompt={getPromptCardForEngine(data, "runway", index)}
                onCopy={onCopy}
              />
            ))}
          </div>
        </div>
      )}

      {videoWorkspace === "kling" && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/12 p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-sm font-extrabold text-blue-900 dark:text-blue-100">
              Kling Shots
            </div>
            <span className="rounded-full bg-[color:var(--surface-elevated)] px-2 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200 dark:text-blue-200">
              Kling 3.0 | Action workflow | Audio-capable
            </span>
          </div>

          <p className="mb-3 text-xs text-blue-800 dark:text-blue-100/90">
            Optional full Kling 4-shot bundle. It works especially well for
            pressure build and peak action, and the hybrid route uses Kling for
            Shot 2 and Shot 3.
          </p>
          <p className="mb-3 text-xs text-blue-800 dark:text-blue-100/90">
            Paste-ready body is director-style narrative. Negative prompts OK.
            Bind Subject + Start/End Frame. Structured breakdown remains for
            reference.
          </p>

          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onCopy(
                  klingPromptCards
                    .map((card) => card.pasteReady)
                    .filter(Boolean)
                    .join("\n\n---\n\n")
                )
              }
              className="rounded-lg border border-blue-200 bg-blue-100 px-3 py-1.5 text-xs font-extrabold text-blue-900 hover:bg-blue-200 active:scale-95 dark:bg-blue-500/15 dark:text-blue-100 dark:hover:bg-blue-500/25"
            >
              Copy Kling Bodies
            </button>
            {data.klingNative15s && (
              <button
                type="button"
                onClick={() => {
                  onOpenDirectWorkspace("kling15");
                  onOpenWorkspace("direct");
                }}
                className="rounded-lg border border-blue-300 bg-[color:var(--surface-elevated)] px-3 py-1.5 text-xs font-extrabold text-blue-800 hover:bg-blue-500/12 active:scale-95 dark:text-blue-100"
              >
                Open Kling 10s Direct Prompt
              </button>
            )}
          </div>

          <div className="space-y-3">
            {klingShots.map((shot, index) => (
              <ProShotCard
                key={`kling-pro-${index}`}
                engine="kling"
                index={index}
                shot={shot}
                prompt={getPromptCardForEngine(data, "kling", index)}
                onCopy={onCopy}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
