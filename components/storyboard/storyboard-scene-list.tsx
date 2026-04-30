"use client";

import { useMemo, useState } from "react";

import CopyButton, { copyTextToClipboard } from "@/components/storyboard/copy-button";
import CopyScenePromptsButton from "@/components/storyboard/copy-scene-prompts-button";
import StoryboardPromptFilter, {
  type StoryboardPromptFilter as PromptFilter,
} from "@/components/storyboard/storyboard-prompt-filter";
import type { StoryboardPreviewData, StoryboardPreviewScene } from "@/lib/storyboard-from-build";

type StoryboardSceneListProps = {
  storyboard: StoryboardPreviewData;
  downloadStoryboardJsonHref?: string | null;
  downloadStoryboardJsonFilename?: string | null;
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

function buildScenePromptText(scene: StoryboardPreviewScene): string {
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

function buildStoryboardPromptText(storyboard: StoryboardPreviewData): string {
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

export default function StoryboardSceneList({
  storyboard,
  downloadStoryboardJsonHref,
  downloadStoryboardJsonFilename,
}: StoryboardSceneListProps) {
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

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-6 shadow-[var(--surface-shadow)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
              Creator tools
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[color:var(--text)]">
              Prompt handling
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
              Filter, copy, and export storyboard prompts without changing any source files. These actions stay browser-side only.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton
              text={allPromptsText}
              label="All Storyboard Prompts"
              idleText="Copy All Prompts"
              size="md"
            />
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
          </div>
        </div>

        <div className="mt-5">
          <StoryboardPromptFilter value={filter} onChange={setFilter} />
        </div>
      </div>

      {storyboard.sequence.map((scene) => (
        <article
          key={scene.id}
          className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-6 shadow-[var(--surface-shadow)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
                Scene {String(scene.id).padStart(2, "0")}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[color:var(--text)]">
                {scene.displayName}
              </h2>
            </div>
            <div className="space-y-2 text-right text-xs text-[color:var(--muted)]">
              <div>Duration: {formatDuration(scene.duration)}</div>
              <div>Start: {formatDuration(scene.startTime)}</div>
              <div>Final shot reference: {scene.finalShotReference ? scene.finalShotReference : "None"}</div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3">
            <div className="flex flex-wrap gap-3 text-sm text-[color:var(--muted)]">
              <span><span className="font-semibold text-[color:var(--text)]">Camera:</span> {scene.camera}</span>
              <span><span className="font-semibold text-[color:var(--text)]">Motion:</span> {scene.motion}</span>
            </div>
            <CopyScenePromptsButton sceneId={scene.id} text={buildScenePromptText(scene)} />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <PromptBlock label="Image Prompt" value={scene.imagePrompt} promptKind="image" filter={filter} />
            <PromptBlock
              label="Nano Banana 2 Master Prompt"
              value={scene.nanoBananaPrompt}
              promptKind="nano-banana"
              filter={filter}
            />
            <PromptBlock
              label="GPT Image 2 Backup Prompt"
              value={scene.gptImagePrompt}
              promptKind="gpt-image"
              filter={filter}
            />
            <PromptBlock label="Video Prompt" value={scene.videoPrompt} promptKind="video" filter={filter} />
            <PromptBlock label="Runway Prompt" value={scene.runwayPrompt} promptKind="runway" filter={filter} />
            <PromptBlock label="Kling Prompt" value={scene.klingPrompt} promptKind="kling" filter={filter} />
            <PromptBlock
              label="Negative Prompt"
              value={scene.negativePrompt || "No negative prompt provided."}
              promptKind="support"
              filter={filter}
            />
            <PromptBlock
              label="Continuity Rules"
              value={scene.continuityRules.length > 0 ? scene.continuityRules.join("\n") : "No continuity rules provided."}
              promptKind="support"
              filter={filter}
            />
          </div>
        </article>
      ))}
    </section>
  );
}
