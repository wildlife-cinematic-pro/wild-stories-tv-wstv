"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { OverviewWorkspace } from "@/components/output-cards/workspaces/OverviewWorkspace";
import { PromptsWorkspace } from "@/components/output-cards/workspaces/PromptsWorkspace";
import { VideoWorkspace } from "@/components/output-cards/workspaces/VideoWorkspace";
import { DirectWorkspace } from "@/components/output-cards/workspaces/DirectWorkspace";
import { PublishingWorkspace } from "@/components/output-cards/workspaces/PublishingWorkspace";
import { EvidenceWorkspace } from "@/components/output-cards/workspaces/EvidenceWorkspace";
import { AdvancedWorkspace } from "@/components/output-cards/workspaces/AdvancedWorkspace";
import { FastPublishPanel } from "@/components/output-cards/fast-publish-panel";
import type {
  DirectWorkspaceTab,
  OutputWorkspaceTab,
  VideoWorkspaceTab,
} from "@/components/output-cards/workspaces/types";
import {
  WorkspaceJumpCard,
  WorkspaceTabButton,
} from "@/components/output-cards/shared-panels";
import { useOutputCopy } from "@/components/output-cards/use-output-copy";

import {
  buildCopyAllPacksText as buildCopyAllPacksTextFromPackage,
  buildExportTxtFull as buildExportTxtFullFromPackage,
} from "@/lib/export-text";
import { downloadText } from "@/lib/storage";
import { buildUsagePayload, getUsageRisk, trackUsage } from "@/lib/usage-tracker";

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
  const workspaceTabRailRef = useRef<HTMLDivElement | null>(null);
  const onCopy = useOutputCopy();

  useEffect(() => {
    const activeTab = workspaceTabRailRef.current?.querySelector<HTMLButtonElement>(
      `[data-workspace-tab="${activeWorkspace}"]`
    );

    activeTab?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }, [activeWorkspace]);

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

  const runwayShotCount = data.runwayShots?.length ?? 0;
  const klingShotCount = data.klingShots?.length ?? 0;
  const seedanceShotCount = data.seedanceShots?.length ?? 0;
  const directPromptCount = [
    Boolean(data.seedanceMultiShotPrompt),
    Boolean(data.klingNative15s),
  ].filter(Boolean).length;

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
      key: "evidence",
      label: "Evidence",
      detail: "Score real generations, drift notes, keep/retry",
      badge: "QA",
    },
    {
      key: "advanced",
      label: "Advanced",
      detail: "CapCut, sound, behavior, analytics",
      badge: "Pro",
    },
  ];

  const getWorkspaceTabId = (tab: OutputWorkspaceTab) => `output-workspace-tab-${tab}`;
  const getWorkspacePanelId = (tab: OutputWorkspaceTab) => `output-workspace-panel-${tab}`;

  const score = data.usAudienceScore?.total ?? 0;
  const hook = data.hookFamily ?? "unknown";
  const risk = getUsageRisk(data);
  const hasBlockers = (data.publishGuardReport?.blockers?.length ?? 0) > 0;
  const isPass = data.publishGuardReport?.isPass === true;
  const canPublish = score > 70 && !hasBlockers && isPass;

  const decision = {
    score,
    hook,
    risk,
    label: canPublish ? "PUBLISH" : "DO NOT PUBLISH",
    color: canPublish ? "text-green-400" : "text-red-400",
  };

  const workspaceOverviewCards = [
    {
      key: "overview" as const,
      eyebrow: "Story",
      title: `${safeStr(data.predatorName || "Predator")} vs ${safeStr(
        data.preyName || "Prey")}`,
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

  return (
    <div className="space-y-5 sm:space-y-6">
      {decision && (
        <div className="mb-4 rounded-xl border border-[color:var(--border)] bg-black/80 p-4">
          <div className={`text-lg font-black ${decision.color}`}>
            {decision.label}
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-300">
            <div>US Score: {decision.score}</div>
            <div>Hook: {decision.hook}</div>
            <div>Risk: {decision.risk}</div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--surface-shadow)] sm:p-5">
        {decision && (
          <div className="mb-4 rounded-xl border border-[color:var(--border)] bg-black/80 p-4">
            <div className={`text-lg font-black ${decision.color}`}>
              {decision.label}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-300">
              <div>US Score: {decision.score}</div>
              <div>Hook: {decision.hook}</div>
              <div>Risk: {decision.risk}</div>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
              WSTV Output Workspace
            </div>
            <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-[color:var(--text)]">
              Compact dashboard view
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-[color:var(--muted)]">
              Long-scroll कम गर्न outputs लाई focused workspaces मा छुट्याइएको छ.
              Daily काम गर्दा main prompt, video engine, direct prompt,
              publishing, र advanced tools अब छुट्टै switch गरेर खोल्न मिल्छ.
            </p>
            {data.routingNote && (
              <div className="mt-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-500/12 dark:text-amber-100">
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
              className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-4 py-2 text-xs font-extrabold text-[color:var(--text)] hover:bg-[color:var(--surface-muted)] active:scale-95"
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

      <FastPublishPanel data={data} onCopy={onCopy} />

      <div className="sticky top-3 z-20 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-2 shadow-[var(--surface-shadow)] backdrop-blur">
        <div
          ref={workspaceTabRailRef}
          role="tablist"
          className="flex gap-2 overflow-x-auto pb-1 scroll-smooth overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Output workspace navigation"
        >
          {workspaceTabs.map((item) => (
            <WorkspaceTabButton
              key={item.key}
              tabKey={item.key}
              tabId={getWorkspaceTabId(item.key)}
              panelId={getWorkspacePanelId(item.key)}
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
        <div
          id={getWorkspacePanelId("overview")}
          role="tabpanel"
          aria-labelledby={getWorkspaceTabId("overview")}
        >
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

      {activeWorkspace === "prompts" && (
        <div
          id={getWorkspacePanelId("prompts")}
          role="tabpanel"
          aria-labelledby={getWorkspaceTabId("prompts")}
        >
          <PromptsWorkspace data={data} onCopy={onCopy} />
        </div>
      )}

      {activeWorkspace === "video" && (
        <div
          id={getWorkspacePanelId("video")}
          role="tabpanel"
          aria-labelledby={getWorkspaceTabId("video")}
        >
          <VideoWorkspace
          data={data}
          videoWorkspace={videoWorkspace}
          onVideoWorkspaceChange={setVideoWorkspace}
          onOpenDirectWorkspace={setDirectWorkspace}
          onOpenWorkspace={setActiveWorkspace}
          onCopy={onCopy}
        />
        </div>
      )}

      {activeWorkspace === "direct" && (
        <div
          id={getWorkspacePanelId("direct")}
          role="tabpanel"
          aria-labelledby={getWorkspaceTabId("direct")}
        >
          <DirectWorkspace
          data={data}
          directWorkspace={directWorkspace}
          onDirectWorkspaceChange={setDirectWorkspace}
          onCopy={onCopy}
        />
        </div>
      )}

      {activeWorkspace === "publishing" && (
        <div
          id={getWorkspacePanelId("publishing")}
          role="tabpanel"
          aria-labelledby={getWorkspaceTabId("publishing")}
        >
          <PublishingWorkspace data={data} onCopy={onCopy} />
        </div>
      )}

      {activeWorkspace === "evidence" && (
        <div
          id={getWorkspacePanelId("evidence")}
          role="tabpanel"
          aria-labelledby={getWorkspaceTabId("evidence")}
        >
          <EvidenceWorkspace data={data} />
        </div>
      )}

      {activeWorkspace === "advanced" && (
        <div
          id={getWorkspacePanelId("advanced")}
          role="tabpanel"
          aria-labelledby={getWorkspaceTabId("advanced")}
        >
          <AdvancedWorkspace data={data} onCopy={onCopy} />
        </div>
      )}
    </div>
  );
}
