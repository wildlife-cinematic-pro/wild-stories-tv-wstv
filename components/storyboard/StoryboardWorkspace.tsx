"use client";

import { useMemo, useState } from "react";

import CopyButton, { copyTextToClipboard } from "@/components/storyboard/copy-button";
import StoryboardPromptFilter, {
  type StoryboardPromptFilter as PromptFilter,
} from "@/components/storyboard/storyboard-prompt-filter";
import StoryboardSceneList, {
  buildStoryboardPromptText,
  type StoryboardWorkspaceMode,
} from "@/components/storyboard/storyboard-scene-list";
import WorkspaceCard from "@/components/workspace/WorkspaceCard";
import WorkspaceSection from "@/components/workspace/WorkspaceSection";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import type { StoryboardPreviewData } from "@/lib/storyboard-from-build";

type StoryboardWorkspaceProps = {
  storyboard: StoryboardPreviewData;
  downloadStoryboardJsonHref?: string | null;
  downloadStoryboardJsonFilename?: string | null;
};

type StoryboardWorkspaceSection =
  | "overview"
  | StoryboardWorkspaceMode
  | "exports";

const SIDEBAR_ITEMS = [
  { id: "overview", label: "Overview", icon: "⌘", detail: "Project summary and scene health", badge: "Start" },
  { id: "scene-list", label: "Scene List", icon: "☰", detail: "Readable scene metadata and timing", badge: "5x" },
  { id: "prompt-handling", label: "Prompt Handling", icon: "✦", detail: "Filters, copy, and export workflow", badge: "Tools" },
  { id: "image-prompts", label: "Image Prompts", icon: "▣", detail: "Core storyboard still prompts", badge: "Image" },
  { id: "nano-banana", label: "Nano Banana 2", icon: "◈", detail: "Primary wildlife master still prompts", badge: "Primary" },
  { id: "gpt-image", label: "GPT Image 2", icon: "◌", detail: "Backup and cover-safe still prompts", badge: "Backup" },
  { id: "video-prompts", label: "Video Prompts", icon: "▶", detail: "General motion handoff prompts", badge: "Video" },
  { id: "runway", label: "Runway", icon: "↗", detail: "Image-to-video motion prompts", badge: "I2V" },
  { id: "kling", label: "Kling", icon: "⇥", detail: "Action and physics prompt lane", badge: "Motion" },
  { id: "support", label: "Support / Continuity", icon: "✓", detail: "Negative prompts and continuity rules", badge: "QA" },
  { id: "exports", label: "Exports", icon: "⬇", detail: "Copy all, download TXT, copy URL", badge: "Export" },
] as const;

const SECTION_COPY: Record<StoryboardWorkspaceSection, { title: string; subtitle: string }> = {
  overview: {
    title: "Overview",
    subtitle: "Mac-style storyboard navigation for quick scene review, prompt handling, and export actions.",
  },
  "scene-list": {
    title: "Scene List",
    subtitle: "Read the sequence as production beats first, then drill into prompt detail only when you need it.",
  },
  "prompt-handling": {
    title: "Prompt Handling",
    subtitle: "Filter and copy prompt groups without editing any source JSON or production files.",
  },
  "image-prompts": {
    title: "Image Prompts",
    subtitle: "Review the core storyboard still prompts scene by scene.",
  },
  "nano-banana": {
    title: "Nano Banana 2",
    subtitle: "Primary wildlife documentary master still prompts with clean first-frame spacing.",
  },
  "gpt-image": {
    title: "GPT Image 2",
    subtitle: "Backup still, thumbnail, cover, and strict composition alternates.",
  },
  "video-prompts": {
    title: "Video Prompts",
    subtitle: "General motion prompts before you split into engine-specific handoff.",
  },
  runway: {
    title: "Runway",
    subtitle: "Image-to-video continuity prompts optimized for stable handoff from the master still.",
  },
  kling: {
    title: "Kling",
    subtitle: "Action-oriented prompts with readable blocking and motion clarity.",
  },
  support: {
    title: "Support / Continuity",
    subtitle: "Negative constraints and continuity guardrails stay visible here so the route never hides them.",
  },
  exports: {
    title: "Exports",
    subtitle: "Copy and download tools stay browser-side only; nothing writes back to storyboard_system from the UI.",
  },
};

function formatDuration(seconds: number): string {
  return `${seconds}s`;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <WorkspaceCard className="h-full bg-[color:var(--surface-elevated)]" title={value} eyebrow={label}>
      <div className="hidden" />
    </WorkspaceCard>
  );
}

export default function StoryboardWorkspace({
  storyboard,
  downloadStoryboardJsonHref,
  downloadStoryboardJsonFilename,
}: StoryboardWorkspaceProps) {
  const [activeSection, setActiveSection] =
    useState<StoryboardWorkspaceSection>("overview");
  const [filter, setFilter] = useState<PromptFilter>("all");
  const [urlStatus, setUrlStatus] = useState<"idle" | "copied" | "error">("idle");

  const allPromptsText = useMemo(() => buildStoryboardPromptText(storyboard), [storyboard]);
  const promptsDownloadHref = useMemo(
    () => `data:text/plain;charset=utf-8,${encodeURIComponent(allPromptsText)}`,
    [allPromptsText]
  );

  async function handleCopyUrl() {
    try {
      await copyTextToClipboard(window.location.href);
      setUrlStatus("copied");
      window.setTimeout(() => setUrlStatus("idle"), 1500);
    } catch {
      setUrlStatus("error");
      window.setTimeout(() => setUrlStatus("idle"), 1500);
    }
  }

  const headerMeta = (
    <div className="flex flex-wrap gap-2">
      <span
        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
          storyboard.valid
            ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
            : "border-amber-400/40 bg-amber-500/10 text-amber-200"
        }`}
      >
        {storyboard.valid ? "Validation passed" : "Needs attention"}
      </span>
      <span className="inline-flex items-center rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
        {storyboard.sourceLabel}
      </span>
      <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
        {storyboard.masterImagePrimaryEngine ?? "nano-banana-2"} → {storyboard.masterImageBackupEngine ?? "gpt-image-2"}
      </span>
    </div>
  );

  const topActions = (
    <>
      <CopyButton text={allPromptsText} label="All Storyboard Prompts" idleText="Copy All Prompts" size="md" />
      <a
        href={promptsDownloadHref}
        download={`${storyboard.project}-prompts.txt`}
        className="inline-flex items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm font-semibold text-[color:var(--text)] transition hover:border-cyan-400/60 hover:text-cyan-200"
      >
        Download prompts.txt
      </a>
      <button
        type="button"
        onClick={handleCopyUrl}
        aria-label="Copy Storyboard URL"
        className="inline-flex items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm font-semibold text-[color:var(--text)] transition hover:border-cyan-400/60 hover:text-cyan-200"
      >
        {urlStatus === "copied" ? "Copied ✓" : urlStatus === "error" ? "Copy failed" : "Copy URL"}
      </button>
      {downloadStoryboardJsonHref && downloadStoryboardJsonFilename ? (
        <a
          href={downloadStoryboardJsonHref}
          download={downloadStoryboardJsonFilename}
          className="inline-flex items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm font-semibold text-[color:var(--text)] transition hover:border-cyan-400/60 hover:text-cyan-200"
        >
          Download storyboard.json
        </a>
      ) : null}
    </>
  );

  const copy = SECTION_COPY[activeSection];

  return (
    <WorkspaceShell
      sidebarTitle="Storyboard workspace"
      sidebarSubtitle="A Mac-style creator workspace for scene review, prompt handling, engine handoff, and exports."
      title={copy.title}
      subtitle={copy.subtitle}
      sidebarItems={SIDEBAR_ITEMS.map((item) => ({ ...item }))}
      activeItem={activeSection}
      onActiveItemChange={(id) => setActiveSection(id as StoryboardWorkspaceSection)}
      topActions={topActions}
      headerMeta={headerMeta}
    >
      {activeSection === "overview" ? (
        <div className="space-y-5">
          <WorkspaceSection
            title="Storyboard at a glance"
            description="Keep the master image strategy, validation health, and scene order visible before you drill into individual prompt families."
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Total Duration" value={formatDuration(storyboard.duration)} />
              <StatCard label="Scene Count" value={String(storyboard.sceneCount)} />
              <StatCard
                label="Valid Scenes"
                value={`${storyboard.summary.validScenes}/${storyboard.summary.sceneCount}`}
              />
              <StatCard
                label="Valid Prompts"
                value={`${storyboard.summary.validPrompts}/${storyboard.summary.promptCount}`}
              />
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            title="Master image strategy"
            description="Nano Banana 2 is recommended for wildlife documentary master stills. GPT Image 2 stays ready as the backup for thumbnails, covers, alternate clean frames, or stricter layout refinement."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <WorkspaceCard
                eyebrow="Primary engine"
                title={storyboard.masterImagePrimaryEngine ?? "nano-banana-2"}
                description={storyboard.masterImageUseCase ?? "wildlife documentary source still"}
              >
                <p className="text-sm leading-6 text-[color:var(--text)]">
                  Use the master still first, then hand that frame to Runway or Kling for motion.
                </p>
              </WorkspaceCard>
              <WorkspaceCard
                eyebrow="Backup engine"
                title={storyboard.masterImageBackupEngine ?? "gpt-image-2"}
                description={storyboard.backupImageUseCase ?? "thumbnail, cover, alternate clean frame"}
              >
                <p className="text-sm leading-6 text-[color:var(--text)]">
                  This lane is especially useful when you want poster-safe spacing, cleaner silhouette readability, or a cover-ready alternate.
                </p>
              </WorkspaceCard>
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            title="Scene quick view"
            description="Read the sequence as a compact plan before opening the heavier prompt sections."
          >
            <div className="grid gap-4 xl:grid-cols-2">
              {storyboard.sequence.map((scene) => (
                <WorkspaceCard
                  key={scene.id}
                  eyebrow={`Scene ${String(scene.id).padStart(2, "0")}`}
                  title={scene.displayName}
                  description={`${scene.camera} · ${scene.motion}`}
                  className="bg-[color:var(--surface-elevated)]"
                >
                  <div className="space-y-2 text-sm text-[color:var(--muted)]">
                    <div>Duration: {formatDuration(scene.duration)}</div>
                    <div>Start: {formatDuration(scene.startTime)}</div>
                    <div>Final shot reference: {scene.finalShotReference ? scene.finalShotReference : "None"}</div>
                  </div>
                </WorkspaceCard>
              ))}
            </div>
          </WorkspaceSection>
        </div>
      ) : null}

      {activeSection === "scene-list" ? (
        <WorkspaceSection
          title="Scene list"
          description="This view keeps the sequence readable as production beats, with scene-level copy still available for each card."
        >
          <StoryboardSceneList storyboard={storyboard} mode="scene-list" />
        </WorkspaceSection>
      ) : null}

      {activeSection === "prompt-handling" ? (
        <div className="space-y-5">
          <WorkspaceSection
            title="Prompt handling"
            description="Filter the prompt families client-side, then copy only the pieces you need. Copy actions always use the full underlying text."
          >
            <StoryboardPromptFilter value={filter} onChange={setFilter} />
          </WorkspaceSection>
          <StoryboardSceneList storyboard={storyboard} mode="prompt-handling" filter={filter} />
        </div>
      ) : null}

      {activeSection === "image-prompts" ? <StoryboardSceneList storyboard={storyboard} mode="image-prompts" /> : null}
      {activeSection === "nano-banana" ? <StoryboardSceneList storyboard={storyboard} mode="nano-banana" /> : null}
      {activeSection === "gpt-image" ? <StoryboardSceneList storyboard={storyboard} mode="gpt-image" /> : null}
      {activeSection === "video-prompts" ? <StoryboardSceneList storyboard={storyboard} mode="video-prompts" /> : null}
      {activeSection === "runway" ? <StoryboardSceneList storyboard={storyboard} mode="runway" /> : null}
      {activeSection === "kling" ? <StoryboardSceneList storyboard={storyboard} mode="kling" /> : null}
      {activeSection === "support" ? <StoryboardSceneList storyboard={storyboard} mode="support" /> : null}

      {activeSection === "exports" ? (
        <WorkspaceSection
          title="Exports"
          description="All export actions stay browser-side. Use Copy All for quick handoff, prompts.txt for editor workflows, or storyboard.json when you want to carry the build-derived snapshot out of the route."
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <WorkspaceCard eyebrow="Prompt bundle" title="Copy All Prompts" description="Copies every scene in sequence with full prompt text.">
              <p className="text-sm leading-6 text-[color:var(--text)]">Best for fast paste into notes, docs, or collaborator chat.</p>
            </WorkspaceCard>
            <WorkspaceCard eyebrow="Text export" title="Download prompts.txt" description="Downloads a plain-text sequence of the storyboard prompts.">
              <p className="text-sm leading-6 text-[color:var(--text)]">Useful when an editor or producer wants the whole prompt pack as a file.</p>
            </WorkspaceCard>
            <WorkspaceCard eyebrow="Share" title="Copy URL / storyboard.json" description="Dynamic build mode keeps the setup in the URL and optional JSON download only.">
              <p className="text-sm leading-6 text-[color:var(--text)]">Nothing on this page writes back to storyboard_system or production outputs.</p>
            </WorkspaceCard>
          </div>
        </WorkspaceSection>
      ) : null}
    </WorkspaceShell>
  );
}
