"use client";

import PromptVersionsPanel from "@/components/PromptVersionsPanel";
import WSTVWorkflowDiagram from "@/components/WSTVWorkflowDiagram";
import { WorkflowPromptMap } from "@/components/output-cards/workflow-prompt-map";
import { EngineSpecsPanel, SectionLabel } from "@/components/output-cards/shared-panels";

import type { GeneratedPackage, PromptVersion } from "@/types";

export function OverviewWorkspace({
  data,
  versionKey,
  onRestoreVersion,
  showWorkflowDiagram,
  onToggleWorkflowDiagram,
  onCopy,
}: {
  data: GeneratedPackage;
  versionKey: string;
  onRestoreVersion?: (version: PromptVersion) => void;
  showWorkflowDiagram: boolean;
  onToggleWorkflowDiagram: () => void;
  onCopy: (text: string) => void | Promise<unknown>;
}) {
  return (
    <div className="space-y-6">
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
