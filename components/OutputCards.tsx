"use client";

import { useMemo, useState } from "react";

import PromptVersionsPanel from "@/components/PromptVersionsPanel";
import WSTVWorkflowDiagram from "@/components/WSTVWorkflowDiagram";
import {
  AnimalBehaviorPanel,
  CapCutScriptPanel,
  FiveShotPanel,
  SoundDesignPanel,
  WatchTimePanel,
} from "@/components/output-cards/advanced-panels";
import {
  Caption2026Panel,
  Hook2026Panel,
  PlatformPackPanel,
  PostingTimesPanel,
} from "@/components/output-cards/publishing-panels";
import {
  Card,
  EngineSpecsPanel,
  ProShotCard,
  SectionLabel,
  ShotImagePlanPanel,
  WorkspaceJumpCard,
  WorkspaceTabButton,
} from "@/components/output-cards/shared-panels";
import { WorkflowPromptMap } from "@/components/output-cards/workflow-prompt-map";
import {
  getImagePromptCard,
  getKlingNative15sCard,
  getKlingSixShotCard,
  getPromptCardForEngine,
  getSeedanceMultiShotCard,
  getWorkflowPromptCard,
} from "@/components/output-cards/prompt-utils";

import { buildCopyAllPacksText as buildCopyAllPacksTextFromPackage, buildExportTxtFull as buildExportTxtFullFromPackage } from "@/lib/export-text";
import { downloadText } from "@/lib/storage";

import type { GeneratedPackage, PromptVersion } from "@/types";

type OutputWorkspaceTab =
  | "overview"
  | "prompts"
  | "video"
  | "direct"
  | "publishing"
  | "advanced";

type VideoWorkspaceTab = "hybrid" | "seedance" | "runway" | "kling";
type DirectWorkspaceTab = "seedance" | "kling15" | "kling6";

const HOOK_FAMILY_LABELS = ["Danger", "Curiosity", "Reversal"] as const;

function copyToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

function formatHookFamilyLabel(value: string): string {
  return value
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function OutputCards({
  data,
  onRestoreVersion,
}: {
  data: GeneratedPackage;
  onRestoreVersion?: (version: PromptVersion) => void;
}) {
  const onCopy = copyToClipboard;
  const [showWSTVWorkflowDiagram, setShowWSTVWorkflowDiagram] = useState(false);
  const [activeWorkspace, setActiveWorkspace] =
    useState<OutputWorkspaceTab>("overview");
  const [videoWorkspace, setVideoWorkspace] =
    useState<VideoWorkspaceTab>("hybrid");
  const [directWorkspace, setDirectWorkspace] =
    useState<DirectWorkspaceTab>("seedance");

  const runwayShots = useMemo(
    () => (data.runwayShots ?? []).map((shot) => String(shot ?? "")),
    [data.runwayShots]
  );
  const klingShots = useMemo(
    () => (data.klingShots ?? []).map((shot) => String(shot ?? "")),
    [data.klingShots]
  );
  const seedanceShots = useMemo(
    () => (data.seedanceShots ?? []).map((shot) => String(shot ?? "")),
    [data.seedanceShots]
  );

  const imagePromptCard = useMemo(() => getImagePromptCard(data), [data]);
  const runwayPromptCards = useMemo(
    () => runwayShots.map((_, index) => getPromptCardForEngine(data, "runway", index)),
    [data, runwayShots]
  );
  const klingPromptCards = useMemo(
    () => klingShots.map((_, index) => getPromptCardForEngine(data, "kling", index)),
    [data, klingShots]
  );
  const seedancePromptCards = useMemo(
    () =>
      seedanceShots.map((_, index) =>
        getPromptCardForEngine(data, "seedance", index)
      ),
    [data, seedanceShots]
  );
  const seedanceMultiShotCard = useMemo(() => getSeedanceMultiShotCard(data), [data]);
  const klingNative15sCard = useMemo(() => getKlingNative15sCard(data), [data]);
  const klingSixShotCard = useMemo(() => getKlingSixShotCard(data), [data]);

  const versionKey = useMemo(() => {
    const predator = data.predatorName ?? "";
    const prey = data.preyName ?? "";
    const arc = String(data.arcName ?? "");
    if (!predator || !prey || !arc) return "";
    return `${predator}|${prey}|${arc}`;
  }, [data.predatorName, data.preyName, data.arcName]);

  function safeStr(value: unknown) {
    if (typeof value === "string") return value.trim();
    if (Array.isArray(value)) return value.map(String).join("\n").trim();
    return String(value ?? "").trim();
  }

  const primaryShotPlan = useMemo(() => {
    return (data.shotPlan ?? []).map((item, index) => {
      const title = safeStr(item.title) || `Shot ${index + 1}`;
      const note = title.split("—")[1]?.trim() ?? "";
      const durationLabel = safeStr(item.durationLabel);
      const isRunway = item.engine === "RUNWAY";

      return {
        ...item,
        title,
        note,
        durationLabel,
        promptCard: getWorkflowPromptCard(data, index),
        cardEngine: isRunway ? ("runway" as const) : ("kling" as const),
        engineLabel: isRunway ? "Runway" : "Kling",
        color: isRunway
          ? "border-green-200 bg-green-50 text-green-900"
          : "border-blue-200 bg-blue-50 text-blue-900",
      };
    });
  }, [data]);

  const isLongHybridLane =
    data.durationLane === "long" || data.pipelineStyle === "long-hybrid-4-shot";
  const hybridRouteBadge = isLongHybridLane
    ? "LONG • 50s total"
    : "SHORT • Hybrid 4-shot";
  const hybridRouteTiming = isLongHybridLane
    ? "Runway 10 / Kling 15 / Kling 15 / Runway 10"
    : "Runway 1 → Kling 2-3 → Runway 4";
  const hybridRouteSummary = isLongHybridLane
    ? "This long lane keeps the same continuity-safe hybrid route, but gives Shot 1 a slower readable setup, Shot 2-3 a stronger 15-second build/payoff, and Shot 4 a cleaner aftermath resolve."
    : "This primary route keeps the opening and resolve cleaner in Runway, while using Kling for the middle pressure/action beats. It matches the main mixed-engine WSTV workflow.";

  const publishReadiness = useMemo(() => {
    const usViewsModeReport = (data.usViewsModeReport ??
      null) as Record<string, unknown> | null;
    const audienceSource = (data.usAudienceScore ??
      usViewsModeReport?.audienceScore ??
      null) as Record<string, unknown> | null;
    const openingSource = (data.openingFrameScore ??
      usViewsModeReport?.openingFrameScore ??
      null) as Record<string, unknown> | null;
    const guardSource = (data.publishGuardReport ??
      usViewsModeReport?.publishGuard ??
      null) as Record<string, unknown> | null;

    const audienceTotal =
      typeof audienceSource?.total === "number" ? audienceSource.total : null;
    const audienceSummary =
      typeof audienceSource?.summary === "string"
        ? audienceSource.summary.trim()
        : typeof audienceSource?.verdict === "string"
          ? formatHookFamilyLabel(audienceSource.verdict)
          : "";

    const openingTotal =
      typeof openingSource?.total === "number" ? openingSource.total : null;
    const openingSummary =
      typeof openingSource?.summary === "string"
        ? openingSource.summary.trim()
        : typeof openingSource?.note === "string"
          ? openingSource.note.trim()
          : "";

    const publishGuardWarnings = Array.isArray(guardSource?.warnings)
      ? guardSource.warnings.map((warning) => safeStr(warning)).filter(Boolean)
      : [];
    const publishGuardPass =
      typeof guardSource?.isPass === "boolean"
        ? guardSource.isPass
        : typeof guardSource?.pass === "boolean"
          ? guardSource.pass
          : null;

    const rawHookFamily =
      typeof data.hookFamily === "string"
        ? data.hookFamily
        : typeof usViewsModeReport?.hookFamily === "string"
          ? String(usViewsModeReport.hookFamily)
          : "";
    const bestHookFamily = rawHookFamily
      ? formatHookFamilyLabel(rawHookFamily)
      : typeof data.recommendedHookIndex === "number" &&
          HOOK_FAMILY_LABELS[data.recommendedHookIndex]
        ? HOOK_FAMILY_LABELS[data.recommendedHookIndex]
        : "";

    const shouldPublish =
      typeof usViewsModeReport?.shouldPublish === "boolean"
        ? usViewsModeReport.shouldPublish
        : audienceTotal !== null &&
            openingTotal !== null &&
            publishGuardPass !== null
          ? audienceTotal >= 70 && openingTotal >= 60 && publishGuardPass
          : null;

    return {
      audienceTotal,
      audienceSummary,
      openingTotal,
      openingSummary,
      publishGuardPass,
      publishGuardWarnings,
      bestHookFamily,
      shouldPublish,
    };
  }, [
    data.hookFamily,
    data.openingFrameScore,
    data.publishGuardReport,
    data.recommendedHookIndex,
    data.usAudienceScore,
    data.usViewsModeReport,
  ]);

  function buildCopyAllPacksText() {
    return buildCopyAllPacksTextFromPackage(data);
  }

  function buildExportTxtFull() {
    return buildExportTxtFullFromPackage(data);
  }

  async function copyAllPacks() {
    const text = buildCopyAllPacksText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      onCopy(text);
    }
  }

  function exportTxt() {
    const text = buildExportTxtFull();
    const predator = safeStr(data.predatorName || "predator");
    const prey = safeStr(data.preyName || "prey");
    const arc = safeStr(data.arcName || "arc").replace(/\s+/g, "_");
    downloadText(`wstv-export-${predator}-vs-${prey}-${arc}.txt`, text);
  }

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

  const workspaceTabs: {
    key: OutputWorkspaceTab;
    label: string;
    detail: string;
    badge: string;
  }[] = [
    {
      key: "overview",
      label: "Overview",
      detail: "Diagram, routing, prompt map, versions",
      badge: "Start",
    },
    {
      key: "prompts",
      label: "Prompts",
      detail: "Image, thumbnail, negative, image plan",
      badge: "Core",
    },
    {
      key: "video",
      label: "Video",
      detail:
        "Primary hybrid route, plus optional Seedance, Runway, and Kling bundles",
      badge: "4 shots",
    },
    {
      key: "direct",
      label: "Direct",
      detail: "Single-paste multi-shot prompt blocks",
      badge: "Fast",
    },
    {
      key: "publishing",
      label: "Publishing",
      detail: "Hooks, caption, packs, posting",
      badge: "Post",
    },
    {
      key: "advanced",
      label: "Advanced",
      detail: "CapCut, sound, behavior, analytics",
      badge: "Pro",
    },
  ];

  const workspaceOverviewCards = [
    {
      key: "overview" as const,
      eyebrow: "Story",
      title: `${safeStr(data.predatorName || "Predator")} vs ${safeStr(
        data.preyName || "Prey"
      )}`,
      detail:
        safeStr(data.arcName || "") ||
        "Core story arc appears here once a package is generated.",
      footer: data.routingNote
        ? `Routing: ${safeStr(data.routingNote)}`
        : "Open routing and workflow map",
    },
    {
      key: "prompts" as const,
      eyebrow: "Prompts",
      title: `${data.shotImagePlan?.length ?? 0} image prompts ready`,
      detail:
        "Image prompt, thumbnail prompt, and continuity image plan are grouped together here.",
      footer: "Open core prompt workspace",
    },
    {
      key: "video" as const,
      eyebrow: "Video",
      title: `${seedanceShots.length}/${runwayShots.length}/${klingShots.length} engine packs`,
      detail:
        "Switch between the primary Hybrid route and the optional Seedance, Runway, and Kling bundles instead of scrolling through every shot at once.",
      footer: "Open video workspace",
    },
    {
      key: "direct" as const,
      eyebrow: "Direct",
      title: `${
        [hasSeedanceDirect, hasKling15Direct, hasKling6Direct].filter(Boolean)
          .length
      } direct prompts available`,
      detail:
        "Single-paste multi-shot prompt blocks live here for faster testing inside the generation tools.",
      footer: "Open direct prompt workspace",
    },
    {
      key: "publishing" as const,
      eyebrow: "Publishing",
      title: "Hook, caption, CTA, posting",
      detail:
        "Social copy, platform packs, and final posting guidance are separated from the build phase.",
      footer: "Open publishing workspace",
    },
    {
      key: "advanced" as const,
      eyebrow: "Advanced",
      title: "CapCut, sound, behavior, analytics",
      detail:
        "Keep research-heavy and polish-heavy assets in one place so daily work stays lighter.",
      footer: "Open advanced workspace",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-amber-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
              WSTV Output Workspace
            </div>
            <h2 className="mt-1 text-2xl font-black text-slate-900">
              Compact dashboard view
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Long-scroll कम गर्न outputs लाई focused workspaces मा छुट्याइएको छ.
              Daily काम गर्दा main prompt, video engine, direct prompt,
              publishing, र advanced tools अब छुट्टै switch गरेर खोल्न मिल्छ.
            </p>
            {data.routingNote && (
              <div className="mt-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                Current routing: {safeStr(data.routingNote)}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copyAllPacks}
              className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-extrabold text-white hover:bg-black active:scale-95"
            >
              📋 Copy All Packs
            </button>

            <button
              type="button"
              onClick={exportTxt}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-extrabold text-gray-800 hover:bg-gray-50 active:scale-95"
            >
              ⬇ Export TXT
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {workspaceOverviewCards.map((item) => (
            <WorkspaceJumpCard
              key={item.key}
              eyebrow={item.eyebrow}
              title={item.title}
              detail={item.detail}
              footer={item.footer}
              active={activeWorkspace === item.key}
              onClick={() => setActiveWorkspace(item.key)}
            />
          ))}
        </div>
      </div>

      <div className="sticky top-3 z-20 overflow-x-auto rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur">
        <div className="flex gap-2">
          {workspaceTabs.map((item) => (
            <WorkspaceTabButton
              key={item.key}
              label={item.label}
              detail={item.detail}
              badge={item.badge}
              active={activeWorkspace === item.key}
              onClick={() => setActiveWorkspace(item.key)}
            />
          ))}
        </div>
      </div>

      {activeWorkspace === "overview" && (
        <div className="space-y-6">
          <EngineSpecsPanel />

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
            Meta Reels export: 9:16 vertical, audio on, and keep important text
            inside the safe zone.
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionLabel label="WSTV Pipeline — Node Graph" />
            <button
              type="button"
              onClick={() => setShowWSTVWorkflowDiagram((previous) => !previous)}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-extrabold text-gray-800 hover:bg-gray-50 active:scale-95"
            >
              {showWSTVWorkflowDiagram ? "Hide Diagram" : "Show Diagram"}
            </button>
          </div>
          {showWSTVWorkflowDiagram ? (
            <WSTVWorkflowDiagram data={data} onCopy={onCopy} />
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
              Node graph hidden by default. Click &quot;Show Diagram&quot; to
              open it.
            </div>
          )}

          <SectionLabel label="WSTV Workflow Prompt Map" />
          <WorkflowPromptMap data={data} onCopy={onCopy} />

          {versionKey && (
            <>
              <SectionLabel label="🕘 Prompt Versions" />
              <PromptVersionsPanel
                versionKey={versionKey}
                onRestoreVersion={onRestoreVersion}
              />
            </>
          )}
        </div>
      )}

      {activeWorkspace === "prompts" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
            Core prompt workspace मा image prompt, thumbnail prompt, negative
            prompt, र continuity image plan grouped छन् so setup गर्दा यही tab
            enough हुन्छ.
          </div>

          <SectionLabel label="Core Prompts" />

          <Card
            title="📸 Image Prompt"
            value={data.imagePrompt}
            onCopy={onCopy}
            accent="border-l-amber-500"
            aiEnhanced={data.aiEnhanced}
            extraActions={[
              {
                label: "Copy BODY",
                onClick: () => onCopy(imagePromptCard.pasteReady),
                className:
                  "rounded border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800 hover:bg-amber-100 active:scale-95",
              },
            ]}
          />

          {data.shotImagePlan && data.shotImagePlan.length > 0 && (
            <ShotImagePlanPanel plans={data.shotImagePlan} onCopy={onCopy} />
          )}

          {data.negativePrompt && (
            <Card
              title="🚫 Negative Prompt (Kling / image models only, not Runway)"
              value={data.negativePrompt}
              onCopy={onCopy}
              accent="border-l-red-400"
              extraActions={[
                {
                  label: "⚠️ NOT for Runway",
                  onClick: () => {},
                  className:
                    "cursor-default rounded border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600",
                },
              ]}
            />
          )}

          {data.thumbnailPrompt && (
            <Card
              title="🖼️ Thumbnail Prompt"
              value={data.thumbnailPrompt}
              onCopy={onCopy}
              accent="border-l-purple-400"
            />
          )}
        </div>
      )}

      {activeWorkspace === "video" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-gray-900">
                  Video workspace
                </div>
                <p className="mt-1 max-w-3xl text-xs leading-relaxed text-gray-600">
                  {isLongHybridLane
                    ? "Current package is using the true long hybrid 4-shot lane: 50 seconds total with Runway 10 / Kling 15 / Kling 15 / Runway 10. Optional Seedance, full Runway, and full Kling bundles still stay below as secondary views."
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
                    onClick={() => setVideoWorkspace(item.key)}
                    className={`rounded-xl border px-3 py-2 text-xs font-extrabold ${
                      videoWorkspace === item.key
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <SectionLabel label="🎬 Video Shots (Pro Layout)" />

          {videoWorkspace === "hybrid" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-extrabold text-violet-900">
                    {isLongHybridLane
                      ? "Primary long hybrid 4-shot route summary"
                      : "Primary hybrid 4-shot route summary"}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-violet-700 ring-1 ring-violet-200">
                      {hybridRouteBadge}
                    </span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-violet-700 ring-1 ring-violet-200">
                      {hybridRouteTiming}
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-violet-800">
                  {hybridRouteSummary}
                </p>

                {isLongHybridLane && (
                  <div className="mt-3 rounded-xl border border-violet-200 bg-white/80 px-3 py-2 text-[11px] font-semibold text-violet-700">
                    Long-form hybrid pacing: Shot 1 readable setup, Shot 2
                    pressure build, Shot 3 main payoff, Shot 4 aftermath
                    resolve.
                  </div>
                )}

                <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-violet-500">
                  {isLongHybridLane
                    ? "Continuity-safe hybrid route preserved"
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
                      <div className="mt-2 text-base font-black">
                        {item.engineLabel}
                      </div>
                      <div className="mt-1 text-xs font-medium opacity-80">
                        {item.note}
                      </div>
                      {item.durationLabel && (
                        <div className="mt-2 inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-violet-700 ring-1 ring-violet-200">
                          {item.durationLabel}
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
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-extrabold text-orange-900">
                  Seedance Shots
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-orange-700 ring-1 ring-orange-200">
                  Seedance 2.0 | optional full 4-shot bundle | multimodal refs
                </span>
              </div>

              <p className="mb-3 text-xs text-orange-800">
                Optional full Seedance 2.0 bundle. Base workflow: `Prompt` +
                `First Frame`, then add `Ref Image` or `Ref Video` only when
                useful. Standard Seedance setup here is 4 separate shots at 5
                seconds each. Keep static description light, describe subject
                movement + background movement + camera movement, and avoid
                negative prompts.
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
                  className="rounded-lg border border-orange-200 bg-orange-100 px-3 py-1.5 text-xs font-extrabold text-orange-900 hover:bg-orange-200 active:scale-95"
                >
                  Copy Seedance Bodies
                </button>

                {data.seedanceMultiShotPrompt && (
                  <button
                    type="button"
                    onClick={() => {
                      setDirectWorkspace("seedance");
                      setActiveWorkspace("direct");
                    }}
                    className="rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-extrabold text-orange-800 hover:bg-orange-50 active:scale-95"
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
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-sm font-extrabold text-green-900">
                  Runway Shots
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-green-700 ring-1 ring-green-200">
                  Gen-4.5 | 24/25fps | 720p
                </span>
              </div>

              <p className="mb-3 text-xs text-green-800">
                Optional full Runway 4-shot bundle. It supports opening tension,
                pressure build, peak action, and resolved tension. In the
                hybrid route, Runway is used for Shot 1 and Shot 4.
              </p>

              <p className="mb-3 text-xs text-green-800">
                I2V = motion only. No negative prompts. Last-frame chaining is
                recommended only when the outgoing frame remains a clean
                full-body handoff frame.
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
                  className="rounded-lg border border-green-200 bg-green-100 px-3 py-1.5 text-xs font-extrabold text-green-900 hover:bg-green-200 active:scale-95"
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
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="text-sm font-extrabold text-blue-900">
                  Kling Shots
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200">
                  Kling 3.0 | Action workflow | Audio-capable
                </span>
              </div>

              <p className="mb-3 text-xs text-blue-800">
                Optional full Kling 4-shot bundle. It works especially well for
                pressure build and peak action, and the hybrid route uses Kling
                for Shot 2 and Shot 3.
              </p>
              <p className="mb-3 text-xs text-blue-800">
                Paste-ready body is director-style narrative. Negative prompts
                OK. Bind Subject + Start/End Frame. Structured breakdown remains
                for reference.
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
                  className="rounded-lg border border-blue-200 bg-blue-100 px-3 py-1.5 text-xs font-extrabold text-blue-900 hover:bg-blue-200 active:scale-95"
                >
                  Copy Kling Bodies
                </button>
                {data.klingNative15s && (
                  <button
                    type="button"
                    onClick={() => {
                      setDirectWorkspace("kling15");
                      setActiveWorkspace("direct");
                    }}
                    className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-xs font-extrabold text-blue-800 hover:bg-blue-50 active:scale-95"
                  >
                    Open Kling 15s Direct Prompt
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
      )}

      {activeWorkspace === "direct" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-gray-900">
                  Direct prompt workspace
                </div>
                <p className="mt-1 max-w-3xl text-xs leading-relaxed text-gray-600">
                  One-click multi-shot prompts live here. Seedance 2.0 stays
                  available as an optional direct 4-shot bundle, while Kling
                  formats remain optional alternate / extended prompt formats.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {data.seedanceMultiShotPrompt && (
                  <button
                    type="button"
                    onClick={() => setDirectWorkspace("seedance")}
                    className={`rounded-xl border px-3 py-2 text-xs font-extrabold ${
                      resolvedDirectWorkspace === "seedance"
                        ? "border-orange-700 bg-orange-700 text-white"
                        : "border-orange-200 bg-white text-orange-800 hover:bg-orange-50"
                    }`}
                  >
                    Seedance 2.0
                  </button>
                )}
                {data.klingNative15s && (
                  <button
                    type="button"
                    onClick={() => setDirectWorkspace("kling15")}
                    className={`rounded-xl border px-3 py-2 text-xs font-extrabold ${
                      resolvedDirectWorkspace === "kling15"
                        ? "border-blue-700 bg-blue-700 text-white"
                        : "border-blue-200 bg-white text-blue-800 hover:bg-blue-50"
                    }`}
                  >
                    Kling 15s Optional
                  </button>
                )}
                {data.klingSixShot && (
                  <button
                    type="button"
                    onClick={() => setDirectWorkspace("kling6")}
                    className={`rounded-xl border px-3 py-2 text-xs font-extrabold ${
                      resolvedDirectWorkspace === "kling6"
                        ? "border-indigo-700 bg-indigo-700 text-white"
                        : "border-indigo-200 bg-white text-indigo-800 hover:bg-indigo-50"
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
              <div className="rounded-2xl border border-orange-300 bg-orange-50 p-4 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-extrabold text-orange-900">
                      Seedance 2.0 Direct Multi-Shot
                    </div>

                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-orange-700 ring-1 ring-orange-200">
                      Seedance 2.0
                    </span>

                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-extrabold text-green-700 ring-1 ring-green-200">
                      ✓ 4 shots — 1 prompt
                    </span>

                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-800 ring-1 ring-amber-200">
                      Prompt + First Frame
                    </span>
                  </div>
                </div>

                <p className="mb-3 text-xs leading-relaxed text-orange-800">
                  यो Kling ko direct multi-shot pane जस्तै Seedance 2.0 ko लागि
                  हो. एउटै continuity prompt लाई direct paste गर्न मिल्छ.
                  Current WSTV flow मा 4 linked shots छन्: opening tension →
                  pressure build → peak action → resolved tension. Best result
                  ka lagi `Prompt` + `First Frame` base राख्नुस्, ani चाहियो
                  भने मात्र `Ref Image` / `Ref Video` थप्नुस्.
                </p>

                <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-orange-200 bg-white p-3 text-xs leading-relaxed text-gray-900">
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
                    className="rounded-xl border border-orange-300 bg-white px-4 py-2 text-sm font-extrabold text-orange-700 hover:bg-orange-50 active:scale-[0.98]"
                  >
                    📋 Copy BODY Only
                  </button>
                </div>
              </div>
            )}

          {resolvedDirectWorkspace === "kling15" &&
            data.klingNative15s !== undefined &&
            data.klingNative15s !== null && (
              <div className="rounded-2xl border border-blue-300 bg-blue-50 p-4 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-extrabold text-blue-900">
                      Kling 15-Second Native Multi-Shot
                    </div>

                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200">
                      Kling 3.0 Pro / Standard
                    </span>

                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-extrabold text-green-700 ring-1 ring-green-200">
                      ✓ Zero inter-clip drift
                    </span>

                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-800 ring-1 ring-amber-200">
                      Action-ready | Audio-capable
                    </span>
                  </div>
                </div>

                <p className="mb-3 text-xs leading-relaxed text-blue-800">
                  यो एउटै prompt Kling 3.0 Pro/Standard मा paste गर्दा 15
                  seconds को continuous video आउँछ। 3 अलग shots generate
                  हुन्छन्, Bind Subject / element references use गर्दा subject
                  continuity reinforce गर्न सकिन्छ।
                </p>

                <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl border border-blue-200 bg-white p-3 text-xs leading-relaxed text-gray-900">
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
                    className="rounded-xl border border-blue-300 bg-white px-4 py-2 text-sm font-extrabold text-blue-700 hover:bg-blue-50 active:scale-[0.98]"
                  >
                    📋 Copy BODY Only
                  </button>
                </div>
              </div>
            )}

          {resolvedDirectWorkspace === "kling6" &&
            data.klingSixShot !== undefined &&
            data.klingSixShot !== null && (
              <div className="rounded-2xl border border-indigo-300 bg-indigo-50 p-4 shadow-sm">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-extrabold text-indigo-900">
                      Kling 6-Shot Multi-Scene
                    </div>

                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-indigo-700 ring-1 ring-indigo-200">
                      Kling 3.0 Pro / Standard
                    </span>

                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-extrabold text-green-700 ring-1 ring-green-200">
                      ✓ 6 shots — 1 prompt
                    </span>

                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-extrabold text-amber-800 ring-1 ring-amber-200">
                      Current WSTV workflow
                    </span>
                  </div>
                </div>
                <p className="mb-3 text-xs leading-relaxed text-indigo-800">
                  <span className="font-extrabold">WSTV multi-shot flow:</span>{" "}
                  Opening tension → Pressure hold → Profile pressure → Tension
                  reaction cut → Action pressure wide → Resolved tension wide.
                  एकै prompt ले 6 cinematic shots generate गर्छ — subject
                  identity सबै shots मा locked हुन्छ, and the opening starts
                  with clearer full-subject readability.
                </p>

                <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl border border-indigo-200 bg-white p-3 text-xs leading-relaxed text-gray-900">
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
                    className="rounded-xl border border-indigo-300 bg-white px-4 py-2 text-sm font-extrabold text-indigo-700 hover:bg-indigo-50 active:scale-[0.98]"
                  >
                    📋 Copy BODY Only
                  </button>
                </div>
              </div>
            )}
        </div>
      )}

      {activeWorkspace === "publishing" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 shadow-sm">
            Posting ready assets यहाँ राखिएको छ: hook, caption, voiceover, CTA,
            hashtags, platform pack, अनि posting time guidance.
          </div>

          {(publishReadiness.audienceTotal !== null ||
            publishReadiness.openingTotal !== null ||
            publishReadiness.publishGuardPass !== null ||
            publishReadiness.publishGuardWarnings.length > 0 ||
            publishReadiness.bestHookFamily ||
            publishReadiness.shouldPublish !== null) && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold text-gray-900">
                    Fast Publish Check
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">
                    Main publish path simple राख्न go/no-go, U.S. fit, opening
                    read, and publish guard warnings यही माथि summarize गरिएको
                    छ.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {publishReadiness.shouldPublish !== null && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                      Should Publish
                    </div>
                    <div
                      className={`mt-2 text-lg font-black ${
                        publishReadiness.shouldPublish
                          ? "text-emerald-700"
                          : "text-rose-700"
                      }`}
                    >
                      {publishReadiness.shouldPublish ? "Yes" : "No"}
                    </div>
                  </div>
                )}

                {publishReadiness.audienceTotal !== null && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-blue-600">
                      U.S. Audience Score
                    </div>
                    <div className="mt-2 text-lg font-black text-blue-900">
                      {publishReadiness.audienceTotal}/100
                    </div>
                    {publishReadiness.audienceSummary && (
                      <p className="mt-1 text-xs leading-relaxed text-blue-800">
                        {publishReadiness.audienceSummary}
                      </p>
                    )}
                  </div>
                )}

                {publishReadiness.openingTotal !== null && (
                  <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-violet-600">
                      Opening-Frame Score
                    </div>
                    <div className="mt-2 text-lg font-black text-violet-900">
                      {publishReadiness.openingTotal}/100
                    </div>
                    {publishReadiness.openingSummary && (
                      <p className="mt-1 text-xs leading-relaxed text-violet-800">
                        {publishReadiness.openingSummary}
                      </p>
                    )}
                  </div>
                )}

                {publishReadiness.bestHookFamily && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="text-[11px] font-bold uppercase tracking-wide text-amber-600">
                      Best Hook Family
                    </div>
                    <div className="mt-2 text-lg font-black text-amber-900">
                      {publishReadiness.bestHookFamily}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-amber-800">
                      Recommended hook direction for faster testing.
                    </p>
                  </div>
                )}
              </div>

              {(publishReadiness.publishGuardPass !== null ||
                publishReadiness.publishGuardWarnings.length > 0) && (
                <div
                  className={`mt-4 rounded-xl border p-3 ${
                    publishReadiness.publishGuardPass
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-bold text-gray-900">
                      Publish Guard Warnings
                    </div>
                    {publishReadiness.publishGuardPass !== null && (
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          publishReadiness.publishGuardPass
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {publishReadiness.publishGuardPass
                          ? "Pass"
                          : "Needs cleanup"}
                      </span>
                    )}
                  </div>

                  {publishReadiness.publishGuardWarnings.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {publishReadiness.publishGuardWarnings.map(
                        (warning, index) => (
                          <div
                            key={`${warning}-${index}`}
                            className="rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-xs leading-relaxed text-gray-700"
                          >
                            {warning}
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-600">
                      No publish guard warnings in the current package.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <SectionLabel label="Hooks & Copy" />

          {data.hook2026 && data.hook2026.length > 0 ? (
            <Hook2026Panel
              hooks={data.hook2026}
              oldHook={data.hook}
              onCopy={onCopy}
              recommendedIndex={data.recommendedHookIndex}
            />
          ) : data.hook ? (
            <Card
              title="🔥 Hook"
              value={data.hook}
              onCopy={onCopy}
              accent="border-l-orange-500"
            />
          ) : null}

          {data.caption2026 ? (
            <Caption2026Panel
              caption2026={data.caption2026}
              captionOld={data.caption}
              onCopy={onCopy}
            />
          ) : data.caption ? (
            <Card
              title="📝 Caption"
              value={data.caption}
              onCopy={onCopy}
              accent="border-l-emerald-500"
            />
          ) : null}

          {data.voiceoverLine && (
            <Card
              title="🎙️ Voiceover"
              value={data.voiceoverLine}
              onCopy={onCopy}
              accent="border-l-indigo-500"
              aiEnhanced={data.aiEnhanced}
            />
          )}

          {data.cta && <Card title="📢 CTA" value={data.cta} onCopy={onCopy} />}

          {data.hashtags && (
            <Card title="# Hashtags" value={data.hashtags} onCopy={onCopy} />
          )}

          {data.tags && <Card title="Tags" value={data.tags} onCopy={onCopy} />}

          {data.platformPack && (
            <>
              <SectionLabel label="Platform Packs" />
              <PlatformPackPanel pack={data.platformPack} onCopy={onCopy} />
            </>
          )}

          <SectionLabel label="Posting Strategy" />
          <PostingTimesPanel />
        </div>
      )}

      {activeWorkspace === "advanced" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900 shadow-sm">
            Advanced workspace research, polish, and packaging ko लागि हो.
            Daily execution tab हरू भन्दा अलग राखिएको छ so main workflow light
            रहोस्.
          </div>

          {data.fiveShotCinematic && data.fiveShotViral && (
            <>
              <SectionLabel label="Optional 5-Shot Packs" />
              <FiveShotPanel
                cinematic={data.fiveShotCinematic}
                viral={data.fiveShotViral}
                onCopy={onCopy}
              />
            </>
          )}

          {data.watchTimeReport && (
            <>
              <SectionLabel label="Watch Time & Earnings" />
              <WatchTimePanel report={data.watchTimeReport} />
            </>
          )}

          {data.twoPartViralOverview && (
            <>
              <SectionLabel label="Two-Part Viral Preset" />

              <Card
                title="🎯 Two-Part Viral Overview"
                value={data.twoPartViralOverview}
                onCopy={onCopy}
                accent="border-l-rose-500"
              />

              {data.twoPartWorkflowGuide && (
                <Card
                  title="🧭 Two-Part Workflow Guide"
                  value={data.twoPartWorkflowGuide}
                  onCopy={onCopy}
                  accent="border-l-pink-500"
                />
              )}

              <Card
                title="🔥 Part 1 — Hook + Collision Cliffhanger"
                value={[
                  data.twoPartPart1Hook ? `Hook:\n${data.twoPartPart1Hook}` : "",
                  data.twoPartPart1Caption
                    ? `Caption:\n${data.twoPartPart1Caption}`
                    : "",
                  data.twoPartPart1Draft
                    ? `Draft Prompt:\n${data.twoPartPart1Draft}`
                    : "",
                  data.twoPartPart1Final
                    ? `Final Prompt:\n${data.twoPartPart1Final}`
                    : "",
                ]
                  .filter(Boolean)
                  .join("\n\n")}
                onCopy={onCopy}
                accent="border-l-orange-500"
              />

              <Card
                title="👑 Part 2 — Payoff + Winner Walk"
                value={[
                  data.twoPartPart2Hook ? `Hook:\n${data.twoPartPart2Hook}` : "",
                  data.twoPartPart2Caption
                    ? `Caption:\n${data.twoPartPart2Caption}`
                    : "",
                  data.twoPartPart2Draft
                    ? `Draft Prompt:\n${data.twoPartPart2Draft}`
                    : "",
                  data.twoPartPart2Final
                    ? `Final Prompt:\n${data.twoPartPart2Final}`
                    : "",
                ]
                  .filter(Boolean)
                  .join("\n\n")}
                onCopy={onCopy}
                accent="border-l-amber-500"
              />
            </>
          )}

          {data.capCutScript && (
            <>
              <SectionLabel label="CapCut Script" />
              <CapCutScriptPanel script={data.capCutScript} onCopy={onCopy} />
            </>
          )}

          {data.animalBehavior && (
            <>
              <SectionLabel label="Animal Behavior" />
              <AnimalBehaviorPanel
                behavior={data.animalBehavior}
                predator={data.predatorName ?? "Subject"}
                onCopy={onCopy}
              />
            </>
          )}

          {data.soundDesignPack && (
            <>
              <SectionLabel label="Sound Design" />
              <SoundDesignPanel pack={data.soundDesignPack} onCopy={onCopy} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
