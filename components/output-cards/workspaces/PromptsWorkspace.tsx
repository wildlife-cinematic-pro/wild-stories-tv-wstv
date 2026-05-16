"use client";

import FourShotProductionWorkflow from "@/components/FourShotProductionWorkflow";
import ImageReferenceMergeWorkflow from "@/components/output-cards/ImageReferenceMergeWorkflow";
import { Card, SectionLabel, ShotImagePlanPanel } from "@/components/output-cards/shared-panels";
import {
  getGptImage2PromptCard,
  getImagePromptCard,
} from "@/components/output-cards/prompt-utils";
import { buildCreatorQaPack } from "@/lib/creator-qa-pack";

import type { GeneratedPackage } from "@/types";

function formatPromptBadgeValue(value: unknown, fallback: string) {
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  return String(value)
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function PromptsWorkspace({
  data,
  onCopy,
}: {
  data: GeneratedPackage;
  onCopy: (text: string) => void | Promise<unknown>;
}) {
  const imagePromptCard = getImagePromptCard(data);
  const gptImage2PromptCard = getGptImage2PromptCard(data);
  const creatorQaPack = buildCreatorQaPack(data);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-3">
        <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700 dark:text-amber-200">
          Story Mode: {formatPromptBadgeValue(data.storyMode, "Predator Vs Prey")}
        </span>
        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-cyan-700 dark:text-cyan-200">
          Viral Lane: {formatPromptBadgeValue(data.viralLane, "Tension")}
        </span>
        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-200">
          Safety: Level {Number(data.violenceLevel ?? 1)}/3
        </span>
      </div>

      <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--warning-bg)] p-4 text-sm text-[color:var(--warning-text)] shadow-sm">
        Core prompt workspace मा primary master image prompt, GPT Image 2 backup prompt,
        thumbnail prompt, negative prompt, continuity image plan, अनि Creator QA Pack
        grouped छन् so wildlife master still, backup cover frame, motion handoff, अनि
        creator-side fixes यही tab बाट manage हुन्छ.
      </div>

      <SectionLabel label="IMAGE PROMPTS" />

      <ImageReferenceMergeWorkflow
        data={data}
        structuredPrompts={data.structuredPrompts}
        onCopy={onCopy}
      />

      <SectionLabel label="Generator Prompt Outputs" />

      <Card
        title="📸 Image Prompt"
        value={data.imagePrompt}
        onCopy={onCopy}
        accent="border-l-amber-500"
        aiEnhanced={data.aiEnhanced}
        copyLabel="Copy Image Prompt"
        className="border-amber-400/50"
        copyButtonClassName="w-full rounded-xl bg-amber-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-amber-700 active:scale-95 sm:w-auto"
        extraActions={[
          {
            label: "Copy Image Body",
            onClick: () => onCopy(imagePromptCard.pasteReady),
            className:
              "wstv-copy-button wstv-copy-button-secondary rounded-xl px-3 py-2 text-sm font-semibold active:scale-95",
          },
        ]}
      />

      {data.gptImage2Prompt && (
        <Card
          title="🧭 GPT Image 2 Backup Prompt"
          value={data.gptImage2Prompt}
          onCopy={onCopy}
          accent="border-l-cyan-400"
          copyLabel="Copy GPT Prompt"
          className="border-cyan-400/40"
          copyButtonClassName="wstv-copy-button wstv-copy-button-secondary rounded-xl px-3 py-2 text-sm font-semibold active:scale-95"
          extraActions={[
            {
              label: "BACKUP / COVER",
              onClick: () => {},
              className:
                "wstv-status-badge cursor-default rounded px-2 py-1 text-[10px] font-bold",
            },
            {
              label: "Copy GPT Body",
              onClick: () => onCopy(gptImage2PromptCard.pasteReady),
              className:
                "wstv-copy-button wstv-copy-button-secondary rounded-xl px-3 py-2 text-sm font-semibold active:scale-95",
            },
          ]}
        />
      )}

      {data.shotImagePlan && data.shotImagePlan.length > 0 && (
        <ShotImagePlanPanel plans={data.shotImagePlan} onCopy={onCopy} />
      )}

      <FourShotProductionWorkflow
        data={data}
        structuredPrompts={data.structuredPrompts}
      />

      {data.negativePrompt && (
        <Card
          title="🚫 Negative Prompt (Kling / image models only, not Runway)"
          value={data.negativePrompt}
          onCopy={onCopy}
          accent="border-l-red-400"
          copyLabel="Copy Negative Prompt"
          extraActions={[
            {
              label: "⚠️ NOT for Runway",
              onClick: () => {},
              className:
                "cursor-default rounded border border-[color:var(--border)] bg-[color:var(--danger-bg)] px-2 py-1 text-[10px] font-bold text-[color:var(--danger-text)]",
            },
          ]}
        />
      )}

      <SectionLabel label="Creator QA Pack" />

      <Card
        title="🧪 Creator QA Pack"
        value={creatorQaPack.summaryText}
        onCopy={onCopy}
        accent="border-l-cyan-400"
        copyLabel="Copy Creator QA Pack"
        extraActions={[
          {
            label: "Copy Fix Prompt",
            onClick: () => onCopy(creatorQaPack.masterImageFixPrompt),
            className:
              "wstv-copy-button wstv-copy-button-secondary rounded px-3 py-1 text-sm font-semibold active:scale-95",
          },
          {
            label: "Copy Runway Motion-First",
            onClick: () => onCopy(creatorQaPack.runwayMotionFirstPrompt),
            className:
              "wstv-copy-button wstv-copy-button-secondary rounded px-3 py-1 text-sm font-semibold active:scale-95",
          },
          {
            label: "Copy Compact Negative",
            onClick: () => onCopy(creatorQaPack.compactNegativePrompt),
            className:
              "wstv-copy-button wstv-copy-button-secondary rounded px-3 py-1 text-sm font-semibold active:scale-95",
          },
          {
            label: "Copy Failure Repair",
            onClick: () => onCopy(creatorQaPack.failureRepairPrompt),
            className:
              "wstv-copy-button wstv-copy-button-secondary rounded px-3 py-1 text-sm font-semibold active:scale-95",
          },
        ]}
      />

      <Card
        title="📣 Facebook Viral Pack"
        value={creatorQaPack.facebookSummary}
        onCopy={onCopy}
        accent="border-l-cyan-400"
        copyLabel="Copy Facebook Pack"
        extraActions={[
          {
            label: "Copy Caption",
            onClick: () => onCopy(creatorQaPack.facebookCaption),
            className:
              "wstv-copy-button wstv-copy-button-secondary rounded px-3 py-1 text-sm font-semibold active:scale-95",
          },
          {
            label: "Copy Hashtags",
            onClick: () => onCopy(creatorQaPack.facebookHashtags),
            className:
              "wstv-copy-button wstv-copy-button-secondary rounded px-3 py-1 text-sm font-semibold active:scale-95",
          },
        ]}
      />

      {data.thumbnailPrompt && (
        <Card
          title="🖼️ Thumbnail Prompt"
          value={data.thumbnailPrompt}
          onCopy={onCopy}
          accent="border-l-cyan-400"
          copyLabel="Copy Thumbnail Prompt"
        />
      )}
    </div>
  );
}
