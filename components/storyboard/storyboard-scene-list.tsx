"use client";

import { useState } from "react";

import CopyButton from "@/components/storyboard/copy-button";
import CopyScenePromptsButton from "@/components/storyboard/copy-scene-prompts-button";
import type { StoryboardPromptFilter as PromptFilter } from "@/components/storyboard/storyboard-prompt-filter";
import WorkspaceCard from "@/components/workspace/WorkspaceCard";
import type { StoryboardPreviewData, StoryboardPreviewScene } from "@/lib/storyboard-from-build";

export type StoryboardWorkspaceMode =
  | "scene-list"
  | "prompt-handling"
  | "image-prompts"
  | "nano-banana"
  | "gpt-image"
  | "video-prompts"
  | "runway"
  | "kling"
  | "support";

type StoryboardSceneListProps = {
  storyboard: StoryboardPreviewData;
  mode: StoryboardWorkspaceMode;
  filter?: PromptFilter;
};

type PromptKind =
  | "image"
  | "nano-banana"
  | "gpt-image"
  | "video"
  | "runway"
  | "kling"
  | "support";

function normalizePromptText(text: string | null | undefined, fallback = "Not available."): string {
  return typeof text === "string" && text.trim().length > 0 ? text : fallback;
}

function countWords(text: string | null | undefined): number {
  return normalizePromptText(text, "").trim().split(/\s+/).filter(Boolean).length;
}

function buildPromptMeta(text: string | null | undefined): string {
  const normalized = normalizePromptText(text, "");
  return `${normalized.length} chars · ${countWords(normalized)} words`;
}

function formatDuration(seconds: number): string {
  return `${seconds}s`;
}

export function buildScenePromptText(scene: StoryboardPreviewScene): string {
  const sections = [
    `Scene ${String(scene.id).padStart(2, "0")} — ${scene.displayName}`,
    "",
    "Image Prompt:",
    normalizePromptText(scene.imagePrompt),
    "",
    "Nano Banana 2 Master Prompt:",
    normalizePromptText(scene.nanoBananaPrompt),
    "",
    "GPT Image 2 Backup Prompt:",
    normalizePromptText(scene.gptImagePrompt),
    "",
    "Video Prompt:",
    normalizePromptText(scene.videoPrompt),
    "",
    "Runway Prompt:",
    normalizePromptText(scene.runwayPrompt),
    "",
    "Kling Prompt:",
    normalizePromptText(scene.klingPrompt),
    "",
    "Negative Prompt:",
    normalizePromptText(scene.negativePrompt, "No negative prompt provided."),
    "",
    "Continuity Rules:",
    scene.continuityRules.length > 0
      ? scene.continuityRules.join("\n")
      : "No continuity rules provided.",
  ];

  return sections.join("\n");
}

export function buildStoryboardPromptText(storyboard: StoryboardPreviewData): string {
  return [
    `Storyboard: ${storyboard.project}`,
    `Source: ${storyboard.sourceLabel}`,
    `Scenes: ${storyboard.sceneCount}`,
    `Duration: ${storyboard.duration}s`,
    "",
    ...storyboard.sequence.flatMap((scene, index) =>
      index === 0 ? [buildScenePromptText(scene)] : ["", "────────────────────────", "", buildScenePromptText(scene)]
    ),
  ].join("\n");
}

function matchesFilter(filter: PromptFilter, kind: PromptKind): boolean {
  if (filter === "all") return true;
  if (filter === "master-image") return kind === "nano-banana" || kind === "gpt-image";
  if (filter === "nano-banana") return kind === "nano-banana";
  if (filter === "gpt-image") return kind === "gpt-image";
  if (filter === "image") return kind === "image";
  if (filter === "video") return kind === "video";
  if (filter === "runway") return kind === "runway";
  if (filter === "kling") return kind === "kling";
  if (filter === "support") return kind === "support";
  return false;
}

function PromptBlock({
  label,
  value,
  promptKind,
  filter,
}: {
  label: string;
  value: string | null | undefined;
  promptKind: PromptKind;
  filter: PromptFilter;
}) {
  const [expanded, setExpanded] = useState(false);
  const safeValue = normalizePromptText(value);
  const wordCount = countWords(safeValue);
  const isLong = safeValue.length > 340 || wordCount > 55;
  const visibleText = !isLong || expanded ? safeValue : `${safeValue.slice(0, 340).trimEnd()}…`;

  if (!matchesFilter(filter, promptKind)) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 transition hover:border-cyan-400/60">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
            {label}
          </div>
          <div className="mt-1 text-[11px] text-[color:var(--muted)]">{buildPromptMeta(safeValue)}</div>
        </div>
        <CopyButton text={safeValue} label={label} size="sm" />
      </div>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[color:var(--text)]">
        {visibleText}
      </p>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((previous) => !previous)}
          className="mt-3 text-xs font-semibold text-cyan-200 transition hover:text-cyan-100"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}

function resolveFilter(mode: StoryboardWorkspaceMode, filter: PromptFilter): PromptFilter | null {
  if (mode === "scene-list") return null;
  if (mode === "prompt-handling") return filter;
  if (mode === "image-prompts") return "image";
  if (mode === "nano-banana") return "nano-banana";
  if (mode === "gpt-image") return "gpt-image";
  if (mode === "video-prompts") return "video";
  if (mode === "runway") return "runway";
  if (mode === "kling") return "kling";
  return "support";
}

export default function StoryboardSceneList({
  storyboard,
  mode,
  filter = "all",
}: StoryboardSceneListProps) {
  const effectiveFilter = resolveFilter(mode, filter);

  return (
    <section className="space-y-6">
      {storyboard.sequence.map((scene) => (
        <WorkspaceCard
          key={scene.id}
          eyebrow={`Scene ${String(scene.id).padStart(2, "0")}`}
          title={scene.displayName}
          description={
            mode === "scene-list"
              ? `${scene.description}. ${scene.action}.`
              : "Copy the full scene prompt pack or drill into the focused prompt blocks below."
          }
          actions={
            <CopyScenePromptsButton sceneId={scene.id} text={buildScenePromptText(scene)} />
          }
          className="bg-[color:var(--surface-elevated)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
            <div className="flex flex-wrap gap-3 text-sm text-[color:var(--muted)]">
              <span>
                <span className="font-semibold text-[color:var(--text)]">Duration:</span> {formatDuration(scene.duration)}
              </span>
              <span>
                <span className="font-semibold text-[color:var(--text)]">Start:</span> {formatDuration(scene.startTime)}
              </span>
              <span>
                <span className="font-semibold text-[color:var(--text)]">Camera:</span> {scene.camera}
              </span>
              <span>
                <span className="font-semibold text-[color:var(--text)]">Motion:</span> {scene.motion}
              </span>
            </div>
            <div className="text-xs text-[color:var(--muted)]">
              Final shot reference: {scene.finalShotReference ? scene.finalShotReference : "None"}
            </div>
          </div>

          {mode === "scene-list" ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Description
                </div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--text)]">{scene.description}</p>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Environment / action
                </div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--text)]">
                  {scene.environment}. {scene.action}.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              <PromptBlock
                label="Image Prompt"
                value={scene.imagePrompt}
                promptKind="image"
                filter={effectiveFilter ?? "all"}
              />
              <PromptBlock
                label="Nano Banana 2 Master Prompt"
                value={scene.nanoBananaPrompt}
                promptKind="nano-banana"
                filter={effectiveFilter ?? "all"}
              />
              <PromptBlock
                label="GPT Image 2 Backup Prompt"
                value={scene.gptImagePrompt}
                promptKind="gpt-image"
                filter={effectiveFilter ?? "all"}
              />
              <PromptBlock
                label="Video Prompt"
                value={scene.videoPrompt}
                promptKind="video"
                filter={effectiveFilter ?? "all"}
              />
              <PromptBlock
                label="Runway Prompt"
                value={scene.runwayPrompt}
                promptKind="runway"
                filter={effectiveFilter ?? "all"}
              />
              <PromptBlock
                label="Kling Prompt"
                value={scene.klingPrompt}
                promptKind="kling"
                filter={effectiveFilter ?? "all"}
              />
              <PromptBlock
                label="Negative Prompt"
                value={scene.negativePrompt || "No negative prompt provided."}
                promptKind="support"
                filter={effectiveFilter ?? "all"}
              />
              <PromptBlock
                label="Continuity Rules"
                value={scene.continuityRules.length > 0 ? scene.continuityRules.join("\n") : "No continuity rules provided."}
                promptKind="support"
                filter={effectiveFilter ?? "all"}
              />
            </div>
          )}
        </WorkspaceCard>
      ))}
    </section>
  );
}
