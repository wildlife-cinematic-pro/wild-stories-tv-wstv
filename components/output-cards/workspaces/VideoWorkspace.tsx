"use client";

import { ProShotCard, SectionLabel } from "@/components/output-cards/shared-panels";
import { TimelineModePanel } from "@/components/output-cards/prompt-guidance-panel";
import { getPromptCardForEngine, getWorkflowPromptCard } from "@/components/output-cards/prompt-utils";
import { getDurationLaneConfig } from "@/lib/duration-lanes";
import { getOrderedOutputTabs } from "@/lib/video-output-routing";
import { getRouteAwareCopyActions } from "@/lib/video-route-copy-actions";
import { getProductionChecklistForRoute } from "@/lib/video-production-checklist";
import { WorkflowQACard } from "@/components/output-cards/workspaces/workflow-qa-card";

import type { GeneratedPackage } from "@/types";
import type { DirectWorkspaceTab, VideoWorkspaceTab } from "@/components/output-cards/workspaces/types";

function safeStr(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(String).join("\n").trim();
  return String(value ?? "").trim();
}

const PASTE_READY_SEPARATOR = "\n\n---\n\n";

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
  const orderedVideoTabs = getOrderedOutputTabs(data.primaryVideoRoute);
  const primaryWorkspaceTab = orderedVideoTabs[0];
  const routeLabel = data.primaryVideoRoute?.label ?? "Primary Route: Hybrid 4-shot";
  const routeDetail = data.primaryVideoRoute?.detail;
  const modelGuidance = data.modelPromptGuidance;
  const routeCopyActions = getRouteAwareCopyActions(data);
  const productionChecklist = getProductionChecklistForRoute({
    route: data.primaryVideoRoute,
    guidance: data.modelPromptGuidance,
  });
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
  const hybridPastePack = primaryShotPlan
    .map((item) => item.promptCard.pasteReady)
    .filter(Boolean)
    .join(PASTE_READY_SEPARATOR);

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

          <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap">
            {orderedVideoTabs.map((key) => {
              const baseLabel =
                key === "hybrid"
                  ? "Hybrid"
                  : key === "seedance"
                    ? "Seedance"
                    : key === "runway"
                      ? "Runway"
                      : "Kling";
              const item = {
                key,
                label: key === primaryWorkspaceTab ? `${baseLabel} Primary` : `${baseLabel} Optional`,
              };
              return (
              <button
                key={item.key}
                type="button"
                onClick={() => onVideoWorkspaceChange(item.key)}
                className={`w-full rounded-xl border px-3 py-2 text-xs font-extrabold sm:w-auto ${
                  videoWorkspace === item.key
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--text)] hover:bg-[color:var(--surface-muted)]"
                }`}
              >
                {item.label}
              </button>
            );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--surface-shadow)]">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[color:var(--muted)]">
          Primary video route
        </div>
        <div className="mt-1 text-sm font-extrabold text-[color:var(--text)]">
          {routeLabel}
        </div>
        {routeDetail ? (
          <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted)]">
            {routeDetail}
          </p>
        ) : null}
      </div>

      {modelGuidance ? (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--surface-shadow)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[color:var(--muted)]">
                Model-specific prompt guidance
              </div>
              <div className="mt-1 text-sm font-extrabold text-[color:var(--text)]">
                {modelGuidance.selectedModel}
              </div>
            </div>
            {modelGuidance.sourceFootageRequired ? (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/12 px-2 py-0.5 text-[11px] font-extrabold text-amber-800 dark:text-amber-100">
                Source footage required
              </span>
            ) : null}
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-3">
              <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[color:var(--muted)]">
                Primary Route
              </div>
              <p className="mt-1 text-xs font-bold leading-relaxed text-[color:var(--text)]">
                {modelGuidance.primaryRoute}
              </p>
            </div>
            <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-3">
              <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[color:var(--muted)]">
                Best Use
              </div>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-[color:var(--text)]">
                {modelGuidance.bestUse}
              </p>
            </div>
            <div className="rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-3">
              <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[color:var(--muted)]">
                Copy Tip
              </div>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-[color:var(--text)]">
                {modelGuidance.copyTip}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[color:var(--muted)]">
                  Production Checklist
                </div>
                <div className="mt-1 text-xs font-extrabold text-[color:var(--text)]">
                  {productionChecklist.title}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {productionChecklist.badges.map((badge) => (
                  <span
                    key={badge}
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${
                      badge === "Source footage required" || badge === "Needs verification"
                        ? "border-amber-500/40 bg-amber-500/12 text-amber-800 dark:text-amber-100"
                        : "border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--muted)]"
                    }`}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
            <ul className="mt-3 grid gap-1.5 text-xs font-semibold leading-relaxed text-[color:var(--text)] md:grid-cols-2">
              {productionChecklist.steps.map((step) => (
                <li key={step} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent)]" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => onCopy(productionChecklist.copyText)}
              className="mt-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-1.5 text-xs font-extrabold text-[color:var(--text)] hover:bg-[color:var(--surface)] active:scale-95"
            >
              Copy Production Checklist
            </button>
          </div>

          <WorkflowQACard
            route={data.primaryVideoRoute}
            guidance={data.modelPromptGuidance}
            onCopy={onCopy}
          />

          {routeCopyActions.length ? (
            <div className="mt-3 rounded-xl border border-[color:var(--border-soft)] bg-[color:var(--surface-muted)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.1em] text-[color:var(--muted)]">
                    Route quick copy
                  </div>
                  <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[color:var(--muted)]">
                    Shows only the copy helpers for the current primary video route.
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {routeCopyActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => onCopy(action.text)}
                    title={action.helper}
                    className={`rounded-lg px-3 py-1.5 text-xs font-extrabold active:scale-95 ${
                      action.primary
                        ? "bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-gray-950 dark:hover:bg-gray-200"
                        : "border border-[color:var(--border)] bg-[color:var(--surface-elevated)] text-[color:var(--text)] hover:bg-[color:var(--surface)]"
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

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

            <div className="mt-3 flex flex-col items-start gap-1">
              <button
                type="button"
                onClick={() => onCopy(hybridPastePack)}
                disabled={!hybridPastePack}
                className="rounded-lg bg-violet-700 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-violet-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-[color:var(--surface-muted)] disabled:text-[color:var(--disabled-text)]"
              >
                Copy Hybrid 4-Shot Paste Pack
              </button>
              <p className="text-[11px] font-semibold text-violet-700 dark:text-violet-200">
                Copies paste-ready prompt bodies only, in shot order.
              </p>
            </div>

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

          <div className="mb-3 grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <div className="flex flex-col items-start gap-1">
              <button
                type="button"
                onClick={() =>
                  onCopy(
                    seedancePromptCards
                      .map((card) => card.pasteReady)
                      .filter(Boolean)
                      .join(PASTE_READY_SEPARATOR)
                  )
                }
                className="w-full rounded-lg border border-orange-200 bg-orange-100 px-3 py-1.5 text-xs font-extrabold text-orange-900 hover:bg-orange-200 active:scale-95 dark:bg-orange-500/15 dark:text-orange-100 dark:hover:bg-orange-500/25 sm:w-auto"
              >
                Copy All Seedance Prompts
              </button>
              <span className="text-[11px] font-semibold text-orange-800 dark:text-orange-100/90">
                Copies paste-ready prompt bodies only.
              </span>
            </div>

            {data.seedanceMultiShotPrompt && (
              <button
                type="button"
                onClick={() => {
                  onOpenDirectWorkspace("seedance");
                  onOpenWorkspace("direct");
                }}
                className="w-full rounded-lg border border-orange-300 bg-[color:var(--surface-elevated)] px-3 py-1.5 text-xs font-extrabold text-orange-800 hover:bg-orange-500/12 active:scale-95 dark:text-orange-100 sm:w-auto"
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
          <div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-2">
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

          <div className="mb-3 grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <div className="flex flex-col items-start gap-1">
              <button
                type="button"
                onClick={() =>
                  onCopy(
                    runwayPromptCards
                      .map((card) => card.pasteReady)
                      .filter(Boolean)
                      .join(PASTE_READY_SEPARATOR)
                  )
                }
                className="w-full rounded-lg border border-green-200 bg-green-100 px-3 py-1.5 text-xs font-extrabold text-green-900 hover:bg-green-200 active:scale-95 dark:bg-green-500/15 dark:text-green-100 dark:hover:bg-green-500/25 sm:w-auto"
              >
                Copy All Runway I2V
              </button>
              <span className="text-[11px] font-semibold text-green-800 dark:text-green-100/90">
                Copies paste-ready prompt bodies only.
              </span>
            </div>
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
          <div className="mb-2 flex min-w-0 flex-wrap items-center justify-between gap-2">
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

          <div className="mb-3 grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <div className="flex flex-col items-start gap-1">
              <button
                type="button"
                onClick={() =>
                  onCopy(
                    klingPromptCards
                      .map((card) => card.pasteReady)
                      .filter(Boolean)
                      .join(PASTE_READY_SEPARATOR)
                  )
                }
                className="w-full rounded-lg border border-blue-200 bg-blue-100 px-3 py-1.5 text-xs font-extrabold text-blue-900 hover:bg-blue-200 active:scale-95 dark:bg-blue-500/15 dark:text-blue-100 dark:hover:bg-blue-500/25 sm:w-auto"
              >
                Copy All Kling Prompts
              </button>
              <span className="text-[11px] font-semibold text-blue-800 dark:text-blue-100/90">
                Copies paste-ready prompt bodies only.
              </span>
            </div>
            {data.klingNative15s && (
              <button
                type="button"
                onClick={() => {
                  onOpenDirectWorkspace("kling15");
                  onOpenWorkspace("direct");
                }}
                className="w-full rounded-lg border border-blue-300 bg-[color:var(--surface-elevated)] px-3 py-1.5 text-xs font-extrabold text-blue-800 hover:bg-blue-500/12 active:scale-95 dark:text-blue-100 sm:w-auto"
              >
                Open Kling Frames + Multishot
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
