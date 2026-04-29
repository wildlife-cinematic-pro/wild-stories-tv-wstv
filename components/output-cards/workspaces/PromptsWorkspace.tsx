"use client";

import { Card, SectionLabel, ShotImagePlanPanel } from "@/components/output-cards/shared-panels";
import {
  getGptImage2PromptCard,
  getImagePromptCard,
} from "@/components/output-cards/prompt-utils";

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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/12 p-4 text-sm text-amber-900 shadow-sm dark:text-amber-100">
        Core prompt workspace मा primary master image prompt, GPT Image 2 backup prompt,
        thumbnail prompt, negative prompt, र continuity image plan grouped छन् so
        wildlife master still, backup cover frame, अनि motion handoff यही tab बाट manage हुन्छ.
      </div>

      <SectionLabel label="Core Prompts" />

      <Card
        title="📸 Image Prompt"
        value={data.imagePrompt}
        onCopy={onCopy}
        accent="border-l-amber-500"
        aiEnhanced={data.aiEnhanced}
        extraActions={[
          {
            label: "Copy BODY",
            onClick: () => onCopy(imagePromptCard.pasteReady),
            className:
              "rounded border border-amber-300 bg-amber-500/12 px-3 py-1 text-sm font-semibold text-amber-800 hover:bg-amber-500/20 active:scale-95 dark:text-amber-100",
          },
        ]}
      />

      {data.gptImage2Prompt && (
        <Card
          title="🧭 GPT Image 2 Backup Prompt"
          value={data.gptImage2Prompt}
          onCopy={onCopy}
          accent="border-l-cyan-400"
          extraActions={[
            {
              label: "BACKUP / COVER",
              onClick: () => {},
              className:
                "cursor-default rounded border border-cyan-300 bg-cyan-500/10 px-2 py-1 text-[10px] font-bold text-cyan-800 dark:text-cyan-100",
            },
            {
              label: "Copy BODY",
              onClick: () => onCopy(gptImage2PromptCard.pasteReady),
              className:
                "rounded border border-cyan-300 bg-cyan-500/12 px-3 py-1 text-sm font-semibold text-cyan-800 hover:bg-cyan-500/20 active:scale-95 dark:text-cyan-100",
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

      {data.thumbnailPrompt && (
        <Card
          title="🖼️ Thumbnail Prompt"
          value={data.thumbnailPrompt}
          onCopy={onCopy}
          accent="border-l-purple-400"
        />
      )}
    </div>
  );
}
