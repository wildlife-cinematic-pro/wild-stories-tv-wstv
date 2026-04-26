"use client";

import {
  AnimalBehaviorPanel,
  CapCutScriptPanel,
  FiveShotPanel,
  SoundDesignPanel,
  WatchTimePanel,
} from "@/components/output-cards/advanced-panels";
import { Card, SectionLabel } from "@/components/output-cards/shared-panels";
import {
  buildBlankPerformanceTrackerEntry,
  serializePerformanceTrackerEntryAsCsvRow,
  serializePerformanceTrackerEntryAsJson,
} from "@/lib/performance-tracker";

import type { GeneratedPackage } from "@/types";

export function AdvancedWorkspace({
  data,
  onCopy,
}: {
  data: GeneratedPackage;
  onCopy: (text: string) => void | Promise<unknown>;
}) {
  const performanceTemplate = buildBlankPerformanceTrackerEntry({
    predator: data.predatorName ?? "",
    prey: data.preyName ?? "",
    arc: data.arcName ?? "",
    durationLane: data.durationLane ?? "short",
    hookFamily: data.hookFamily ?? "",
  });
  const performanceTemplateJson =
    serializePerformanceTrackerEntryAsJson(performanceTemplate);
  const performanceTemplateCsv = serializePerformanceTrackerEntryAsCsvRow(
    performanceTemplate,
    true
  );

  const runwayAppsHelper = [
    "OFFICIAL TOOL SURFACE",
    "• Gen-4.5 Image to Video",
    "• Multi-Shot",
    "• References",
    "• Upscale",
    "• Weather / Time of Day",
    "• SFX",
    "• Create Ad / Ad Builder",
    "• Characters",
    "• Act-Two",
    "",
    "WSTV HOUSE RECOMMENDATIONS",
    "• Final hero shots: Gen-4.5 Image to Video",
    "• Fast structure test: Multi-Shot",
    "• Identity/style support: References",
    "• Final polish: Upscale",
    "• Atmosphere repair only: Weather / Time of Day",
    "• Audio / SFX: SFX",
    "• Avoid for daily predator-prey core: Ad Builder / Create Ad, Characters, Act-Two",
    "• Good for WSTV page promo: Ad Builder / Create Ad",
    "• Good for future explainer/avatar: Characters or Act-Two",
  ].join("\n");

  const futureModesNote = [
    "DEFAULT DAILY MODE",
    "• PredatorPrey: daily cinematic wildlife reel",
    "",
    "FUTURE OPTIONAL MODES",
    "• Explainer: weekly host, avatar, or comment-answer content",
    "• PagePromo: WSTV brand promo or follow-page ad",
    "",
    "Keep these future modes optional. They do not replace the daily predator-prey workflow.",
  ].join("\n");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/12 p-4 text-sm text-indigo-900 shadow-sm dark:text-indigo-100">
        Advanced workspace research, polish, and packaging ko लागि हो. Daily
        execution tab हरू भन्दा अलग राखिएको छ so main workflow light रहोस्.
      </div>

      <SectionLabel label="Daily Workflow Helpers" />

      <Card
        title="Runway Apps Helper"
        value={runwayAppsHelper}
        onCopy={onCopy}
        accent="border-l-sky-500"
      />

      <Card
        title="Performance Tracker Template"
        value={performanceTemplateJson}
        onCopy={onCopy}
        accent="border-l-emerald-500"
        extraActions={[
          {
            label: "Copy CSV Row",
            onClick: () => onCopy(performanceTemplateCsv),
            className:
              "rounded border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700 hover:bg-emerald-100 active:scale-95 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100",
          },
        ]}
      />

      <Card
        title="Future Optional Modes"
        value={futureModesNote}
        onCopy={onCopy}
        accent="border-l-indigo-500"
      />
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
