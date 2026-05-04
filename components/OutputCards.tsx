"use client";

import { useEffect, useMemo, useState } from "react";

import { OverviewWorkspace } from "@/components/output-cards/workspaces/OverviewWorkspace";
import { PromptsWorkspace } from "@/components/output-cards/workspaces/PromptsWorkspace";
import { VideoWorkspace } from "@/components/output-cards/workspaces/VideoWorkspace";
import { DirectWorkspace } from "@/components/output-cards/workspaces/DirectWorkspace";
import { PublishingWorkspace } from "@/components/output-cards/workspaces/PublishingWorkspace";
import { EvidenceWorkspace } from "@/components/output-cards/workspaces/EvidenceWorkspace";
import { AdvancedWorkspace } from "@/components/output-cards/workspaces/AdvancedWorkspace";
import { FastPublishPanel } from "@/components/output-cards/fast-publish-panel";
import { PromptGuidancePanel } from "@/components/output-cards/prompt-guidance-panel";
import type {
  DirectWorkspaceTab,
  OutputWorkspaceTab,
  VideoWorkspaceTab,
} from "@/components/output-cards/workspaces/types";
import { WorkspaceJumpCard } from "@/components/output-cards/shared-panels";
import { useOutputCopy } from "@/components/output-cards/use-output-copy";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import WorkspaceSection from "@/components/workspace/WorkspaceSection";

import {
  buildCopyAllPacksText as buildCopyAllPacksTextFromPackage,
  buildExportTxtFull as buildExportTxtFullFromPackage,
} from "@/lib/export-text";
import { getDecision } from "@/lib/decision-engine";
import { downloadJson, downloadText } from "@/lib/storage";
import { buildUsagePayload, trackUsage } from "@/lib/usage-tracker";

import type { GeneratedPackage, PromptVersion } from "@/types";

export default function OutputCards({
  data,
  onRestoreVersion,
}: {
  data: GeneratedPackage;
  onRestoreVersion?: (version: PromptVersion) => void;
}) {
  const [showWSTVWorkflowDiagram, setShowWSTVWorkflowDiagram] = useState(false);
  const [activeWorkspace, setActiveWorkspace] =
    useState<OutputWorkspaceTab>("overview");
  const [videoWorkspace, setVideoWorkspace] =
    useState<VideoWorkspaceTab>("hybrid");
  const [directWorkspace, setDirectWorkspace] =
    useState<DirectWorkspaceTab>("seedance");
  const onCopy = useOutputCopy();

  useEffect(() => {
    trackUsage("view_output", buildUsagePayload(data));
  }, [data]);

  useEffect(() => {
    trackUsage("open_workspace", {
      ...buildUsagePayload(data),
      tab: activeWorkspace,
    });
  }, [activeWorkspace, data]);

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

  function buildCopyAllPacksText() {
    return buildCopyAllPacksTextFromPackage(data);
  }

  function buildExportTxtFull() {
    return buildExportTxtFullFromPackage(data);
  }

  async function copyAllPacks() {
    await onCopy(buildCopyAllPacksText());
    trackUsage("copy_all_packs", buildUsagePayload(data));
  }

  function exportTxt() {
    const text = buildExportTxtFull();
    const predator = safeStr(data.predatorName || "predator");
    const prey = safeStr(data.preyName || "prey");
    const arc = safeStr(data.arcName || "arc").replace(/\s+/g, "_");
    downloadText(`wstv-export-${predator}-vs-${prey}-${arc}.txt`, text);
    trackUsage("export_txt", buildUsagePayload(data));
  }

  function exportJson() {
    const predator = safeStr(data.predatorName || "predator");
    const prey = safeStr(data.preyName || "prey");
    const arc = safeStr(data.arcName || "arc").replace(/\s+/g, "_");
    downloadJson(`wstv-export-${predator}-vs-${prey}-${arc}.json`, data);
    trackUsage("export_txt", { ...buildUsagePayload(data), format: "json" });
  }

  const runwayShotCount = data.runwayShots?.length ?? 0;
  const klingShotCount = data.klingShots?.length ?? 0;
  const seedanceShotCount = data.seedanceShots?.length ?? 0;
  const directPromptCount = [
    Boolean(data.seedanceMultiShotPrompt),
    Boolean(data.klingFramesPrompt ?? data.klingNative15s),
    Boolean(data.klingMultishotShots?.length),
  ].filter(Boolean).length;

  const workspaceTabs: {
    key: OutputWorkspaceTab;
    label: string;
    detail: string;
    badge: string;
    icon: string;
  }[] = [
    {
      key: "overview",
      label: "Overview",
      detail: "Diagram, routing, prompt map, versions",
      badge: "Start",
      icon: "⌘",
    },
    {
      key: "prompts",
      label: "Prompts",
      detail: "Image, thumbnail, negative, image plan",
      badge: "Core",
      icon: "✦",
    },
    {
      key: "video",
      label: "Video",
      detail:
        "Primary hybrid route, plus optional Seedance, Runway, and Kling bundles",
      badge: "4 shots",
      icon: "▶",
    },
    {
      key: "direct",
      label: "Direct",
      detail: "Single-paste multi-shot prompt blocks",
      badge: "Fast",
      icon: "⇥",
    },
    {
      key: "publishing",
      label: "Publishing",
      detail: "Hooks, caption, packs, posting",
      badge: "Post",
      icon: "↑",
    },
    {
      key: "evidence",
      label: "Evidence",
      detail: "Score real generations, drift notes, keep/retry",
      badge: "QA",
      icon: "✓",
    },
    {
      key: "advanced",
      label: "Advanced",
      detail: "CapCut, sound, behavior, analytics",
      badge: "Pro",
      icon: "⋯",
    },
  ];

  const decision = useMemo(() => getDecision(data), [data]);

  const exportSummaryItems = [
    {
      label: "Image prompt",
      included: Boolean(safeStr(data.imagePrompt)),
    },
    {
      label: "Video prompts",
      included: runwayShotCount + klingShotCount + seedanceShotCount > 0,
    },
    {
      label: "Caption",
      included: Boolean(safeStr(data.caption)),
    },
    {
      label: "Hashtags",
      included: Boolean(safeStr(data.hashtags)),
    },
    {
      label: "Safety notes",
      included: Boolean(safeStr(data.negativePrompt) || safeStr(data.qualitySummary)),
    },
    {
      label: "Metadata",
      included: Boolean(safeStr(data.predatorName) && safeStr(data.preyName) && safeStr(data.arcName)),
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
        "Image prompt, thumbnail prompt, continuity image plan, and Creator QA Pack are grouped together here.",
      footer: "Open core prompt workspace",
    },
    {
      key: "video" as const,
      eyebrow: "Video",
      title: `${seedanceShotCount}/${runwayShotCount}/${klingShotCount} engine packs`,
      detail:
        "Switch between the primary Hybrid route and the optional Seedance, Runway, and Kling bundles instead of scrolling through every shot at once.",
      footer: "Open video workspace",
    },
    {
      key: "direct" as const,
      eyebrow: "Direct",
      title: `${directPromptCount} direct prompts available`,
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
      key: "evidence" as const,
      eyebrow: "Evidence",
      title: "Real generation QA loop",
      detail:
        "Score actual outputs, capture drift, and keep a small evidence trail linked to this generation.",
      footer: "Open evidence workspace",
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

  const activeWorkspaceItem =
    workspaceTabs.find((item) => item.key === activeWorkspace) ?? workspaceTabs[0];

  const headerMeta = (
    <div className="flex flex-wrap gap-2">
      {decision ? (
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
            decision.label === "PUBLISH"
              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
              : decision.label === "REWORK"
                ? "border-amber-400/40 bg-amber-500/10 text-amber-200"
                : "border-rose-400/40 bg-rose-500/10 text-rose-200"
          }`}
        >
          {decision.label} · US Score {decision.score}
        </span>
      ) : null}
      {data.routingNote ? (
        <span className="inline-flex rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
          Routing: {safeStr(data.routingNote)}
        </span>
      ) : null}
      <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
        {seedanceShotCount}/{runwayShotCount}/{klingShotCount} engine packs
      </span>
      <span className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
        {directPromptCount} direct prompts
      </span>
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <WorkspaceShell
        sidebarTitle="Output workspace"
        sidebarSubtitle="Mac-style focused navigation for WSTV build outputs. The left sidebar stays visible on desktop while the right panel shows one workspace at a time."
        title={activeWorkspaceItem.label}
        subtitle={activeWorkspaceItem.detail}
        sidebarItems={workspaceTabs.map((item) => ({
          id: item.key,
          label: item.label,
          detail: item.detail,
          badge: item.badge,
          icon: item.icon,
        }))}
        activeItem={activeWorkspace}
        onActiveItemChange={(id) => setActiveWorkspace(id as OutputWorkspaceTab)}
        topActions={
          <>
            <button
              type="button"
              onClick={copyAllPacks}
              className="rounded-xl bg-gray-900 px-4 py-2 text-xs font-extrabold text-white hover:bg-black active:scale-95"
            >
              📋 Copy All Output
            </button>
            <button
              type="button"
              onClick={exportTxt}
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-xs font-extrabold text-[color:var(--text)] hover:border-cyan-400/60 hover:text-cyan-200 active:scale-95"
            >
              ⬇ Export Text
            </button>
            <button
              type="button"
              onClick={exportJson}
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-xs font-extrabold text-[color:var(--text)] hover:border-cyan-400/60 hover:text-cyan-200 active:scale-95"
            >
              ⬇ Export JSON
            </button>
          </>
        }
        headerMeta={headerMeta}
        desktopScrollMode="workspace"
        desktopSidebarCollapsible
      >
        <WorkspaceSection
          title="Export Summary"
          description="Text export, JSON export, and full-package copy stay advisory only. Nothing uploads automatically from this panel."
        >
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--surface-shadow)]">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyAllPacks}
                className="rounded-xl bg-gray-900 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-black active:scale-95"
              >
                Copy Full Package
              </button>
              <button
                type="button"
                onClick={exportTxt}
                className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3.5 py-2 text-xs font-extrabold text-[color:var(--text)] hover:bg-[color:var(--surface-muted)] active:scale-95"
              >
                Export Text
              </button>
              <button
                type="button"
                onClick={exportJson}
                className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3.5 py-2 text-xs font-extrabold text-[color:var(--text)] hover:bg-[color:var(--surface-muted)] active:scale-95"
              >
                Export JSON
              </button>
            </div>

            <div className="mt-3 text-xs leading-relaxed text-[color:var(--muted)]">
              Includes image prompt, video prompts, caption, hashtags, safety notes, and metadata when available.
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {exportSummaryItems.map((item) => (
                <span
                  key={item.label}
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                    item.included
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                      : "border-amber-400/30 bg-amber-500/10 text-amber-200"
                  }`}
                >
                  {item.label} {item.included ? "included" : "missing"}
                </span>
              ))}
            </div>
          </div>
        </WorkspaceSection>

        {activeWorkspace === "overview" && (
          <div className="space-y-5">
            <WorkspaceSection
              title="Workspace map"
              description="Overview stays as the orientation hub. Switch straight into prompts, video, direct paste blocks, publishing, or QA without the old long horizontal desktop rail."
            >
              <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
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
            </WorkspaceSection>

            <FastPublishPanel data={data} onCopy={onCopy} />
            <PromptGuidancePanel data={data} onCopy={onCopy} />
            <OverviewWorkspace
              data={data}
              versionKey={versionKey}
              onRestoreVersion={onRestoreVersion}
              showWorkflowDiagram={showWSTVWorkflowDiagram}
              onToggleWorkflowDiagram={() =>
                setShowWSTVWorkflowDiagram((previous) => !previous)
              }
              onCopy={onCopy}
            />
          </div>
        )}

        {activeWorkspace === "prompts" && <PromptsWorkspace data={data} onCopy={onCopy} />}

        {activeWorkspace === "video" && (
          <VideoWorkspace
            data={data}
            videoWorkspace={videoWorkspace}
            onVideoWorkspaceChange={setVideoWorkspace}
            onOpenDirectWorkspace={setDirectWorkspace}
            onOpenWorkspace={setActiveWorkspace}
            onCopy={onCopy}
          />
        )}

        {activeWorkspace === "direct" && (
          <DirectWorkspace
            data={data}
            directWorkspace={directWorkspace}
            onDirectWorkspaceChange={setDirectWorkspace}
            onCopy={onCopy}
          />
        )}

        {activeWorkspace === "publishing" && (
          <PublishingWorkspace data={data} onCopy={onCopy} />
        )}

        {activeWorkspace === "evidence" && <EvidenceWorkspace data={data} />}

        {activeWorkspace === "advanced" && (
          <AdvancedWorkspace data={data} onCopy={onCopy} />
        )}
      </WorkspaceShell>
    </div>
  );
}
