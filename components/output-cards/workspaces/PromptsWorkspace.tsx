"use client";

import { Card, SectionLabel, ShotImagePlanPanel } from "@/components/output-cards/shared-panels";
import {
  getGptImage2PromptCard,
  getImagePromptCard,
} from "@/components/output-cards/prompt-utils";
import { buildCreatorQaPack } from "@/lib/creator-qa-pack";

import type { GeneratedPackage } from "@/types";

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
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/12 p-4 text-sm text-amber-900 shadow-sm dark:text-amber-100">
        Core prompt workspace मा primary master image prompt, GPT Image 2 backup prompt,
        thumbnail prompt, negative prompt, continuity image plan, अनि Creator QA Pack
        grouped छन् so wildlife master still, backup cover frame, motion handoff, अनि
        creator-side fixes यही tab बाट manage हुन्छ.
      </div>

      <SectionLabel label="Core Prompts" />

      <Card
        title="📸 Image Prompt"
        value={data.imagePrompt}
        onCopy={onCopy}
        accent="border-l-amber-500"
        aiEnhanced={data.aiEnhanced}
        copyLabel="Copy Image Prompt"
        className="border-amber-300/80 bg-amber-50/70 shadow-[0_12px_30px_rgba(245,158,11,0.12)]"
        valueClassName="text-amber-950 dark:text-amber-50"
        copyButtonClassName="w-full rounded-xl bg-amber-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-amber-700 active:scale-95 sm:w-auto"
        extraActions={[
          {
            label: "Copy Image Body",
            onClick: () => onCopy(imagePromptCard.pasteReady),
            className:
              "rounded-xl border border-amber-300 bg-white/80 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-50 active:scale-95 dark:border-amber-200/40 dark:bg-transparent dark:text-amber-100",
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
          className="border-cyan-200/80 bg-cyan-50/40 shadow-none"
          valueClassName="text-cyan-950 dark:text-cyan-50"
          copyButtonClassName="rounded-xl border border-cyan-300 bg-white/85 px-3 py-2 text-sm font-semibold text-cyan-900 hover:bg-cyan-50 active:scale-95 dark:border-cyan-200/40 dark:bg-transparent dark:text-cyan-100"
          extraActions={[
            {
              label: "BACKUP / COVER",
              onClick: () => {},
              className:
                "cursor-default rounded border border-cyan-200 bg-white/80 px-2 py-1 text-[10px] font-bold text-cyan-700 dark:border-cyan-200/40 dark:bg-transparent dark:text-cyan-100",
            },
            {
              label: "Copy GPT Body",
              onClick: () => onCopy(gptImage2PromptCard.pasteReady),
              className:
                "rounded-xl border border-cyan-200 bg-white/80 px-3 py-2 text-sm font-semibold text-cyan-900 hover:bg-cyan-50 active:scale-95 dark:border-cyan-200/40 dark:bg-transparent dark:text-cyan-100",
            },
          ]}
        />
      )}

      {data.shotImagePlan && data.shotImagePlan.length > 0 && (
        <ShotImagePlanPanel plans={data.shotImagePlan} onCopy={onCopy} />
      )}

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
                "cursor-default rounded border border-red-200 bg-red-500/12 px-2 py-1 text-[10px] font-bold text-red-700 dark:text-red-200",
            },
          ]}
        />
      )}

      <SectionLabel label="Creator QA Pack" />

      <Card
        title="🧪 Creator QA Pack"
        value={creatorQaPack.summaryText}
        onCopy={onCopy}
        accent="border-l-indigo-500"
        copyLabel="Copy Creator QA Pack"
        extraActions={[
          {
            label: "Copy Fix Prompt",
            onClick: () => onCopy(creatorQaPack.masterImageFixPrompt),
            className:
              "rounded border border-indigo-300 bg-indigo-500/12 px-3 py-1 text-sm font-semibold text-indigo-800 hover:bg-indigo-500/20 active:scale-95 dark:text-indigo-100",
          },
          {
            label: "Copy Runway Motion-First",
            onClick: () => onCopy(creatorQaPack.runwayMotionFirstPrompt),
            className:
              "rounded border border-indigo-300 bg-indigo-500/12 px-3 py-1 text-sm font-semibold text-indigo-800 hover:bg-indigo-500/20 active:scale-95 dark:text-indigo-100",
          },
          {
            label: "Copy Compact Negative",
            onClick: () => onCopy(creatorQaPack.compactNegativePrompt),
            className:
              "rounded border border-indigo-300 bg-indigo-500/12 px-3 py-1 text-sm font-semibold text-indigo-800 hover:bg-indigo-500/20 active:scale-95 dark:text-indigo-100",
          },
          {
            label: "Copy Failure Repair",
            onClick: () => onCopy(creatorQaPack.failureRepairPrompt),
            className:
              "rounded border border-indigo-300 bg-indigo-500/12 px-3 py-1 text-sm font-semibold text-indigo-800 hover:bg-indigo-500/20 active:scale-95 dark:text-indigo-100",
          },
        ]}
      />

      <Card
        title="📣 Facebook Viral Pack"
        value={creatorQaPack.facebookSummary}
        onCopy={onCopy}
        accent="border-l-rose-400"
        copyLabel="Copy Facebook Pack"
        extraActions={[
          {
            label: "Copy Caption",
            onClick: () => onCopy(creatorQaPack.facebookCaption),
            className:
              "rounded border border-rose-300 bg-rose-500/12 px-3 py-1 text-sm font-semibold text-rose-800 hover:bg-rose-500/20 active:scale-95 dark:text-rose-100",
          },
          {
            label: "Copy Hashtags",
            onClick: () => onCopy(creatorQaPack.facebookHashtags),
            className:
              "rounded border border-rose-300 bg-rose-500/12 px-3 py-1 text-sm font-semibold text-rose-800 hover:bg-rose-500/20 active:scale-95 dark:text-rose-100",
          },
        ]}
      />

      {data.thumbnailPrompt && (
        <Card
          title="🖼️ Thumbnail Prompt"
          value={data.thumbnailPrompt}
          onCopy={onCopy}
          accent="border-l-purple-400"
          copyLabel="Copy Thumbnail Prompt"
        />
      )}
    </div>
  );
}
