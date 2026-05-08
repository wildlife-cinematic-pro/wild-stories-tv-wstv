"use client";

import PromptVersionsPanel from "@/components/PromptVersionsPanel";
import WSTVWorkflowDiagram from "@/components/WSTVWorkflowDiagram";
import { WorkflowPromptMap } from "@/components/output-cards/workflow-prompt-map";
import StoryModeQACard from "@/components/output-cards/story-mode-qa-card";
import FacebookReelsOptimizerCard from "@/components/output-cards/facebook-reels-optimizer-card";
import ReelsPerformanceCard from "@/components/output-cards/reels-performance-card";
import ReelsPerformanceInsightsCard from "@/components/output-cards/reels-performance-insights-card";
import AutoRecommendationsCard from "@/components/output-cards/auto-recommendations-card";
import ABExperimentTrackerCard from "@/components/output-cards/ab-experiment-tracker-card";
import LocalCreatorDataCard from "@/components/output-cards/local-creator-data-card";
import WSTVCreatorGuideCard from "@/components/output-cards/wstv-creator-guide-card";
import { EngineSpecsPanel, SectionLabel } from "@/components/output-cards/shared-panels";

import type { StoryModePreset } from "@/lib/story-mode-presets";
import type { GeneratedPackage, PromptVersion } from "@/types";

function formatBadgeValue(value: unknown, fallback: string) {
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  return String(value)
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function StoryModeBadges({ data }: { data: GeneratedPackage }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-3">
      <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700 dark:text-amber-200">
        Story Mode: {formatBadgeValue(data.storyMode, "Predator Vs Prey")}
      </span>
      <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-indigo-700 dark:text-indigo-200">
        Viral Lane: {formatBadgeValue(data.viralLane, "Tension")}
      </span>
      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-200">
        Safety: Level {Number(data.violenceLevel ?? 1)}/3
      </span>
    </div>
  );
}

export function OverviewWorkspace({
  data,
  versionKey,
  onRestoreVersion,
  showWorkflowDiagram,
  onToggleWorkflowDiagram,
  onCopy,
  onApplyStoryModePreset,
}: {
  data: GeneratedPackage;
  versionKey: string;
  onRestoreVersion?: (version: PromptVersion) => void;
  showWorkflowDiagram: boolean;
  onToggleWorkflowDiagram: () => void;
  onCopy: (text: string) => void | Promise<unknown>;
  onApplyStoryModePreset?: (preset: StoryModePreset) => void;
}) {
  return (
    <div className="space-y-6">
      <StoryModeBadges data={data} />

      <WSTVCreatorGuideCard />

      <StoryModeQACard data={data} />

      <FacebookReelsOptimizerCard data={data} onCopy={onCopy} />

      <ReelsPerformanceCard data={data} />

      <ReelsPerformanceInsightsCard />

      <LocalCreatorDataCard onCopy={onCopy} />

      <AutoRecommendationsCard
        data={data}
        onCopy={onCopy}
        onApplyStoryModePreset={onApplyStoryModePreset}
      />

      <ABExperimentTrackerCard data={data} />

      <EngineSpecsPanel />

      <div className="rounded-lg border border-sky-500/30 bg-sky-500/12 p-3 text-xs text-sky-800 dark:text-sky-200">
        Meta Reels export: 9:16 vertical, audio on, and keep important text
        inside the safe zone.
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel label="WSTV Pipeline — Node Graph" />
        <button
          type="button"
          onClick={onToggleWorkflowDiagram}
          className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-4 py-2 text-xs font-extrabold text-[color:var(--text)] hover:bg-[color:var(--surface-muted)] active:scale-95"
        >
          {showWorkflowDiagram ? "Hide Diagram" : "Show Diagram"}
        </button>
      </div>
      {showWorkflowDiagram ? (
        <WSTVWorkflowDiagram data={data} onCopy={onCopy} />
      ) : (
        <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--muted)]">
          Node graph hidden by default. Click &quot;Show Diagram&quot; to open
          it.
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
  );
}
