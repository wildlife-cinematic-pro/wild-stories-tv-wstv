"use client";

import { useMemo, useState } from "react";

import CopyButton from "@/components/storyboard/copy-button";
import CopyScenePromptsButton from "@/components/storyboard/copy-scene-prompts-button";
import StoryboardPromptFilter, {
  type StoryboardPromptFilterValue,
} from "@/components/storyboard/storyboard-prompt-filter";
import type {
  StoryboardPreviewData,
  StoryboardPreviewScene,
} from "@/lib/storyboard-preview";

type StoryboardSceneListProps = {
  storyboard: StoryboardPreviewData;
  downloadStoryboardJsonHref?: string | null;
  downloadStoryboardJsonFilename?: string | null;
};

type PromptKind = "image" | "video" | "runway" | "kling" | "support";

function formatDuration(seconds: number): string {
  return `${seconds}s`;
}

function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function buildPromptMeta(text: string): string {
  return `${text.length} chars · ${countWords(text)} words`;
}

function buildScenePromptText(scene: StoryboardPreviewScene): string {
  const sceneLabel = `Scene ${String(scene.id).padStart(2, "0")} — ${scene.displayName}`;
  return [
    sceneLabel,
    "",
    "Image Prompt:",
    scene.imagePrompt,
    "",
    "Video Prompt:",
    scene.videoPrompt,
    "",
    "Runway Prompt:",
    scene.runwayPrompt,
    "",
    "Kling Prompt:",
    scene.klingPrompt,
    "",
    "Negative Prompt:",
    scene.negativePrompt || "No negative prompt provided.",
    "",
    "Continuity Rules:",
    scene.continuityRules.length
      ? scene.continuityRules.join("\n")
      : "No continuity rules provided.",
  ].join("\n");
}

function buildStoryboardPromptText(sequence: StoryboardPreviewScene[]): string {
  return sequence
    .map((scene) => buildScenePromptText(scene))
    .join("\n\n────────────────────────\n\n");
}

function PromptBlock({
  label,
  value,
  copyLabel,
  filterValue,
  kind,
}: {
  label: string;
  value: string;
  copyLabel: string;
  filterValue: StoryboardPromptFilterValue;
  kind: PromptKind;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = value.length > 320 || countWords(value) > 55;
  const visible =
    filterValue === "all" ||
    (filterValue === "support" ? kind === "support" : filterValue === kind);

  if (!visible) return null;

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
            {label}
          </div>
          <div className="mt-1 text-[11px] text-[color:var(--muted)]">
            {buildPromptMeta(value)}
          </div>
        </div>
        <CopyButton text={value} label={copyLabel} size="sm" />
      </div>
      <div className={`mt-3 ${!expanded && isLong ? "max-h-28 overflow-hidden" : ""}`}>
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[color:var(--text)]">
          {value}
        </p>
      </div>
      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
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
  const [filterValue, setFilterValue] =
    useState<StoryboardPromptFilterValue>("all");

  const allPromptsText = useMemo(
    () => buildStoryboardPromptText(storyboard.sequence),
    [storyboard.sequence]
  );

  const promptsDownloadHref = useMemo(
    () =>
      `data:text/plain;charset=utf-8,${encodeURIComponent(allPromptsText)}`,
    [allPromptsText]
  );

  const promptsDownloadFilename = `${storyboard.project}.prompts.txt`;
  const currentUrl =
    typeof window === "undefined" ? "" : window.location.href;

  return (
    <>
      <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-6 shadow-[var(--surface-shadow)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
              Creator Tools
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
              Filter prompt types, copy individual prompt blocks, copy a whole
              scene, copy the full storyboard, or download a clean prompts text
              file for Runway and Kling usage.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyButton text={allPromptsText} label="All Prompts" size="md" />
            <a
              href={promptsDownloadHref}
              download={promptsDownloadFilename}
              className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/15"
            >
              Download prompts.txt
            </a>
            <CopyButton text={currentUrl} label="URL" size="md" />
            {downloadStoryboardJsonHref && downloadStoryboardJsonFilename ? (
              <a
                href={downloadStoryboardJsonHref}
                download={downloadStoryboardJsonFilename}
                className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/15"
              >
                Download storyboard.json
              </a>
            ) : null}
          </div>
        </div>

        <div className="mt-5">
          <StoryboardPromptFilter
            value={filterValue}
            onChange={setFilterValue}
          />
        </div>
      </section>

      <section className="space-y-6">
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
              <div className="flex flex-col items-end gap-2 text-right text-xs text-[color:var(--muted)]">
                <div>Duration: {formatDuration(scene.duration)}</div>
                <div>
                  Final shot reference:{" "}
                  {scene.finalShotReference ? scene.finalShotReference : "None"}
                </div>
                <CopyScenePromptsButton
                  sceneId={scene.id}
                  text={buildScenePromptText(scene)}
                />
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Camera
                </div>
                <div className="mt-2 text-lg font-semibold text-[color:var(--text)]">
                  {scene.camera}
                </div>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Motion
                </div>
                <div className="mt-2 text-lg font-semibold text-[color:var(--text)]">
                  {scene.motion}
                </div>
              </div>
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Start Time
                </div>
                <div className="mt-2 text-lg font-semibold text-[color:var(--text)]">
                  {formatDuration(scene.startTime)}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              <PromptBlock
                label="Image Prompt"
                value={scene.imagePrompt}
                copyLabel="Image Prompt"
                filterValue={filterValue}
                kind="image"
              />
              <PromptBlock
                label="Video Prompt"
                value={scene.videoPrompt}
                copyLabel="Video Prompt"
                filterValue={filterValue}
                kind="video"
              />
              <PromptBlock
                label="Runway Prompt"
                value={scene.runwayPrompt}
                copyLabel="Runway Prompt"
                filterValue={filterValue}
                kind="runway"
              />
              <PromptBlock
                label="Kling Prompt"
                value={scene.klingPrompt}
                copyLabel="Kling Prompt"
                filterValue={filterValue}
                kind="kling"
              />
              <PromptBlock
                label="Negative Prompt"
                value={scene.negativePrompt || "No negative prompt provided."}
                copyLabel="Negative Prompt"
                filterValue={filterValue}
                kind="support"
              />
              <PromptBlock
                label="Continuity Rules"
                value={
                  scene.continuityRules.length > 0
                    ? scene.continuityRules.join("\n")
                    : "No continuity rules provided."
                }
                copyLabel="Continuity Rules"
                filterValue={filterValue}
                kind="support"
              />
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
