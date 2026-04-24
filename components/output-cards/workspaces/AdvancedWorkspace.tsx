"use client";

import {
  AnimalBehaviorPanel,
  CapCutScriptPanel,
  FiveShotPanel,
  SoundDesignPanel,
  WatchTimePanel,
} from "@/components/output-cards/advanced-panels";
import { Card, SectionLabel } from "@/components/output-cards/shared-panels";

import type { GeneratedPackage } from "@/types";

export function AdvancedWorkspace({
  data,
  onCopy,
}: {
  data: GeneratedPackage;
  onCopy: (text: string) => void | Promise<unknown>;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/12 p-4 text-sm text-indigo-900 shadow-sm dark:text-indigo-100">
        Advanced workspace research, polish, and packaging ko लागि हो. Daily
        execution tab हरू भन्दा अलग राखिएको छ so main workflow light रहोस्.
      </div>

      {data.fiveShotCinematic && data.fiveShotViral && (
        <>
          <SectionLabel label="Optional 5-Shot Packs" />
          <FiveShotPanel
            cinematic={data.fiveShotCinematic}
            viral={data.fiveShotViral}
            onCopy={onCopy}
          />
        </>
      )}

      {data.watchTimeReport && (
        <>
          <SectionLabel label="Watch Time & Earnings" />
          <WatchTimePanel report={data.watchTimeReport} />
        </>
      )}

      {data.twoPartViralOverview && (
        <>
          <SectionLabel label="Two-Part Viral Preset" />

          <Card
            title="🎯 Two-Part Viral Overview"
            value={data.twoPartViralOverview}
            onCopy={onCopy}
            accent="border-l-rose-500"
          />

          {data.twoPartWorkflowGuide && (
            <Card
              title="🧭 Two-Part Workflow Guide"
              value={data.twoPartWorkflowGuide}
              onCopy={onCopy}
              accent="border-l-pink-500"
            />
          )}

          <Card
            title="🔥 Part 1 — Hook + Collision Cliffhanger"
            value={[
              data.twoPartPart1Hook ? `Hook:
${data.twoPartPart1Hook}` : "",
              data.twoPartPart1Caption
                ? `Caption:
${data.twoPartPart1Caption}`
                : "",
              data.twoPartPart1Draft
                ? `Draft Prompt:
${data.twoPartPart1Draft}`
                : "",
              data.twoPartPart1Final
                ? `Final Prompt:
${data.twoPartPart1Final}`
                : "",
            ]
              .filter(Boolean)
              .join("\n\n")}
            onCopy={onCopy}
            accent="border-l-orange-500"
          />

          <Card
            title="👑 Part 2 — Payoff + Winner Walk"
            value={[
              data.twoPartPart2Hook ? `Hook:
${data.twoPartPart2Hook}` : "",
              data.twoPartPart2Caption
                ? `Caption:
${data.twoPartPart2Caption}`
                : "",
              data.twoPartPart2Draft
                ? `Draft Prompt:
${data.twoPartPart2Draft}`
                : "",
              data.twoPartPart2Final
                ? `Final Prompt:
${data.twoPartPart2Final}`
                : "",
            ]
              .filter(Boolean)
              .join("\n\n")}
            onCopy={onCopy}
            accent="border-l-amber-500"
          />
        </>
      )}

      {data.capCutScript && (
        <>
          <SectionLabel label="CapCut Script" />
          <CapCutScriptPanel script={data.capCutScript} onCopy={onCopy} />
        </>
      )}

      {data.animalBehavior && (
        <>
          <SectionLabel label="Animal Behavior" />
          <AnimalBehaviorPanel
            behavior={data.animalBehavior}
            predator={data.predatorName ?? "Subject"}
            onCopy={onCopy}
          />
        </>
      )}

      {data.soundDesignPack && (
        <>
          <SectionLabel label="Sound Design" />
          <SoundDesignPanel pack={data.soundDesignPack} onCopy={onCopy} />
        </>
      )}
    </div>
  );
}
