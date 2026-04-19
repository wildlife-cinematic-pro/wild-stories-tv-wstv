import type {
  Arc,
  AnimalVibe,
  CapCutScript,
  DepthMode,
  DurationLane,
  EmotionalTone,
  GeneratedPackage,
  HookFamily,
  OpeningFrameScore,
  PerformanceSnapshot,
  PipelineStyle,
  PredatorInfo,
  PublishGuardReport,
  QualityOptions,
  RunwayModel,
  KlingModel,
  TwoPartViralPreset,
  USAudienceScoreResult,
  Weather,
} from "@/types";

import type { OpeningFrameInput } from "@/lib/openingFrameScore";

import {
  buildImagePromptCard,
  buildFourShotWorkflowPromptPack,
  buildSeedancePromptPack,
  buildShotImagePlan,
  buildRunwayPromptPack,
  buildKlingPromptPack,
  buildKlingNative15sCard,
  buildKlingSixShotCard,
  buildNegativePrompt,
  buildThumbnailPrompt,
  buildVoiceoverLine,
  buildCapCutPlan,
  buildClipChaining,
  build10Ideas,
  buildQualitySummary,
  buildReferenceWorkflow,
  buildNaturalismChecklist,
} from "@/lib/prompt-builders";
import {
  buildFiveShotCinematic,
  buildFiveShotViral,
  buildWatchTimeReport,
} from "@/lib/predator-data";
import {
  buildSoundDesignPack,
  getAnimalBehavior,
  buildCapCutScript,
  shouldBuildTwoPartViralPreset,
  buildTwoPartViralPreset,
} from "@/lib/workflow-packs";
import {
  buildCTA,
  buildPlatformPack,
  buildSEOTitle,
  buildAltTextPrompt,
} from "@/lib/platform-packs";
import { arcMotionStrength } from "@/lib/model-specs";
import {
  mergeGeneratedPackage,
  type GeneratedPackageEnhancements,
} from "@/lib/generated-package";
import { buildUSViewsModeReport } from "@/lib/usViewsMode";

type PublishFlowMarketMode = "US_ONLY";

export type PublishFlowSummary = {
  predatorName: string;
  preyName: string;
  arcName: Arc;
  marketMode: PublishFlowMarketMode;
  durationLane: DurationLane;
  hookFamily: HookFamily;
  fastPublishMode: boolean;
  strictOriginalityGuard: boolean;
  pipelineStyle: PipelineStyle;
  primaryHook: string;
  usAudienceScore: USAudienceScoreResult;
  openingFrameScore: OpeningFrameScore;
  publishGuardReport: PublishGuardReport;
  publishWorthy: boolean;
};

export function buildOpeningFrameInput(
  arc: Arc,
  depthMode: DepthMode,
  motionOnlyI2V: boolean,
  referenceLock: boolean,
  singleActionRule: boolean,
  fastPublishMode: boolean,
  hookMode: HookFamily | "all"
): OpeningFrameInput {
  const instantPressureArc =
    arc === "Ambush attack" ||
    arc === "Chase and takedown" ||
    arc === "Escape from danger" ||
    arc === "Predator vs predator fight" ||
    arc === "Defender stands ground";

  return {
    fullBodyReadable: referenceLock || depthMode !== "Cinematic Blur",
    threatReadable: singleActionRule && (instantPressureArc || hookMode === "danger"),
    subjectSeparation: referenceLock && motionOnlyI2V,
    environmentClear: depthMode !== "Cinematic Blur",
    emotionalReadImmediate: fastPublishMode || hookMode !== "all" || instantPressureArc,
  };
}

export type GeneratedPackageDraftInput = {
  predator: string;
  prey: string;
  presetLighting: string;
  presetCameraGear: string;
  presetTexture: string;
  presetDriftRisk: PredatorInfo["driftRisk"];
  presetForIdeas: PredatorInfo;
  finalEnvironment: string;
  finalArc: Arc;
  weather: Weather;
  depthMode: DepthMode;
  emotionalTone: EmotionalTone;
  animalVibe: AnimalVibe;
  runwayModel: RunwayModel;
  klingModel: KlingModel;
  durationLane: DurationLane;
  marketMode: PublishFlowMarketMode;
  fastPublishMode: boolean;
  strictOriginalityGuard: boolean;
  selectedPipelineStyle: PipelineStyle;
  sceneInject: string;
  quality: QualityOptions;
  finalHook2026: string[];
  finalHook: string;
  shortCaption: string;
  longCaption: string;
  hashtags: string;
  tags: string;
  recommendedHookIndex: number;
  hookFamily: HookFamily;
  usAudienceScore: USAudienceScoreResult;
  openingFrameInput: OpeningFrameInput;
  openingFrameScore: OpeningFrameScore;
  performanceSnapshot?: PerformanceSnapshot | null;
};

export type GeneratedPackageDraft = {
  basePkg: GeneratedPackage;
  capCutScript: CapCutScript;
  twoPartViralPreset: TwoPartViralPreset | null;
  marketMode: PublishFlowMarketMode;
  durationLane: DurationLane;
  fastPublishMode: boolean;
  strictOriginalityGuard: boolean;
  hookFamily: HookFamily;
  finalEnvironment: string;
  openingFrameInput: OpeningFrameInput;
  usAudienceScore: USAudienceScoreResult;
  openingFrameScore: OpeningFrameScore;
  performanceSnapshot?: PerformanceSnapshot;
  primaryHook: string;
};

function buildPrimaryShotDurations(durationLane: DurationLane): string[] {
  return durationLane === "long"
    ? ["0–10s", "10–25s", "25–40s", "40–50s"]
    : ["0–4s", "4–9s", "9–15s", "15–20s"];
}

function buildPrimaryShotTitles(durationLane: DurationLane): string[] {
  return durationLane === "long"
    ? [
        "Shot 1 — Opening Tension",
        "Shot 2 — Pressure Build",
        "Shot 3 — Main Action Payoff",
        "Shot 4 — Aftermath Resolve",
      ]
    : [
        "Shot 1 — Opening Tension",
        "Shot 2 — Pressure Build",
        "Shot 3 — Peak Action",
        "Shot 4 — Resolved Tension",
      ];
}

function buildPrimaryShotWhy(durationLane: DurationLane): string[] {
  return durationLane === "long"
    ? [
        "Use Image 1 from the master image for the readable 10-second opening tension and first-frame clarity beat.",
        "Use Image 2 edited from Shot 1 image for the slower 15-second pressure build with wider spacing collapse and stronger continuity-safe body language.",
        "Use Image 3 edited from Shot 2 image for the 15-second main action payoff with the clearest readable force transfer.",
        "Use Image 4 edited from Shot 3 image for the 10-second aftermath hold, winner/retreat resolve, and clean final-frame handoff.",
      ]
    : [
        "Use Image 1 from the master image for the clean first-frame opening.",
        "Use Image 2 edited from Shot 1 image for a stronger physics-safe pressure build without losing identity.",
        "Use Image 3 edited from Shot 2 image for the strongest full-body action beat.",
        "Use Image 4 edited from Shot 3 image for the readable aftermath or final tension hold.",
      ];
}

export function buildGeneratedPackageDraft(
  input: GeneratedPackageDraftInput
): GeneratedPackageDraft {
  const imagePromptCard = buildImagePromptCard(
    input.predator,
    input.prey,
    input.finalEnvironment,
    input.finalArc,
    input.presetLighting,
    input.presetCameraGear,
    input.presetTexture,
    input.depthMode,
    input.weather,
    input.emotionalTone,
    input.animalVibe,
    input.sceneInject,
    input.quality,
    "NANO_BANANA_2"
  );
  const shotImagePlan = buildShotImagePlan(
    input.predator,
    input.prey,
    input.finalEnvironment,
    input.finalArc,
    input.weather,
    input.quality
  );
  const runwayPack = buildRunwayPromptPack(
    input.predator,
    input.prey,
    input.finalEnvironment,
    input.finalArc,
    input.weather,
    input.runwayModel,
    input.emotionalTone,
    input.animalVibe,
    input.sceneInject,
    input.quality
  );
  const seedancePack = buildSeedancePromptPack(
    input.predator,
    input.prey,
    input.finalEnvironment,
    input.finalArc,
    input.weather,
    input.emotionalTone,
    input.animalVibe,
    input.sceneInject,
    input.quality
  );
  const klingPack = buildKlingPromptPack(
    input.predator,
    input.prey,
    input.finalEnvironment,
    input.finalArc,
    input.weather,
    input.klingModel,
    input.emotionalTone,
    input.animalVibe,
    input.sceneInject,
    input.quality
  );
  const fourShotWorkflowPack = buildFourShotWorkflowPromptPack({
    predator: input.predator,
    prey: input.prey,
    durationLane: input.durationLane,
    env: input.finalEnvironment,
    arc: input.finalArc,
    weather: input.weather,
    runwayModel: input.runwayModel,
    klingModel: input.klingModel,
    emotionalTone: input.emotionalTone,
    animalVibe: input.animalVibe,
    sceneDesc: input.sceneInject,
    quality: input.quality,
  });
  const klingNative15sCard = buildKlingNative15sCard(
    input.predator,
    input.prey,
    input.finalEnvironment,
    input.finalArc,
    input.weather,
    input.klingModel,
    input.emotionalTone,
    input.animalVibe,
    input.sceneInject,
    input.quality
  );
  const klingSixShotCard = buildKlingSixShotCard(
    input.predator,
    input.prey,
    input.finalEnvironment,
    input.finalArc,
    input.weather,
    input.klingModel,
    input.emotionalTone,
    input.animalVibe,
    input.sceneInject,
    input.quality
  );

  const negativePromptForKling = buildNegativePrompt(input.predator, "KLING");
  const thumbnailPrompt = buildThumbnailPrompt(
    input.predator,
    input.prey,
    input.finalEnvironment,
    input.weather,
    input.emotionalTone,
    input.animalVibe
  );
  const voiceoverLine = buildVoiceoverLine(
    input.predator,
    input.prey,
    input.finalEnvironment,
    input.emotionalTone
  );
  const capCutPlan = buildCapCutPlan(input.predator, input.finalArc, input.weather);
  const clipChaining = buildClipChaining(input.predator, input.presetDriftRisk);
  const cta = buildCTA(input.finalArc);
  const tenIdeas = build10Ideas(
    input.predator,
    input.presetForIdeas.prey,
    input.presetForIdeas
  );
  const platformPack = buildPlatformPack(
    input.predator,
    input.prey,
    input.finalArc,
    input.finalEnvironment
  );
  const seoTitle = buildSEOTitle(input.predator, input.prey, input.finalArc);
  const altTextPrompt = buildAltTextPrompt(
    input.predator,
    input.prey,
    input.finalEnvironment,
    input.finalArc
  );
  const qualitySummary = buildQualitySummary(input.quality);
  const referenceWorkflow = buildReferenceWorkflow(input.predator, input.quality);
  const naturalismChecklist = buildNaturalismChecklist(
    input.quality,
    input.weather,
    input.finalEnvironment
  );
  const fiveShotCinematic = buildFiveShotCinematic(
    input.predator,
    input.prey,
    input.finalEnvironment,
    input.finalArc,
    input.weather,
    input.runwayModel,
    input.klingModel,
    input.emotionalTone,
    input.animalVibe,
    input.quality
  );
  const fiveShotViral = buildFiveShotViral(
    input.predator,
    input.prey,
    input.finalEnvironment,
    input.finalArc,
    input.weather,
    input.runwayModel,
    input.klingModel,
    input.emotionalTone,
    input.animalVibe,
    input.quality
  );
  const watchTimeReport = buildWatchTimeReport(input.selectedPipelineStyle, 2);
  const soundDesignPack = buildSoundDesignPack(
    input.predator,
    input.prey,
    input.finalEnvironment,
    input.finalArc,
    input.weather,
    input.klingModel
  );
  const animalBehaviorResult = getAnimalBehavior(input.predator);
  const motionStrength = arcMotionStrength[input.finalArc] ?? 70;
  const primaryShotDurations = buildPrimaryShotDurations(input.durationLane);
  const primaryShotTitles = buildPrimaryShotTitles(input.durationLane);
  const primaryShotWhy = buildPrimaryShotWhy(input.durationLane);

  const basePkg: GeneratedPackage = {
    predatorName: input.predator,
    preyName: input.prey,
    arcName: input.finalArc,
    imagePrompt: imagePromptCard.fullText,
    negativePrompt: negativePromptForKling,
    thumbnailPrompt,
    voiceoverLine,
    shotImagePlan,
    structuredPrompts: {
      imagePrompt: imagePromptCard,
      runwayShots: [runwayPack.shot1, runwayPack.shot2, runwayPack.shot3, runwayPack.shot4],
      klingShots: [klingPack.shot1, klingPack.shot2, klingPack.shot3, klingPack.shot4],
      seedanceShots: [
        seedancePack.shot1,
        seedancePack.shot2,
        seedancePack.shot3,
        seedancePack.shot4,
      ],
      seedanceMultiShot: seedancePack.multiShotPrompt,
      workflowShots: [
        fourShotWorkflowPack.shot1,
        fourShotWorkflowPack.shot2,
        fourShotWorkflowPack.shot3,
        fourShotWorkflowPack.shot4,
      ],
      klingNative15s: klingNative15sCard,
      klingSixShot: klingSixShotCard,
    },
    runwayShots: [
      runwayPack.shot1.fullText,
      runwayPack.shot2.fullText,
      runwayPack.shot3.fullText,
      runwayPack.shot4.fullText,
    ],
    klingShots: [
      klingPack.shot1.fullText,
      klingPack.shot2.fullText,
      klingPack.shot3.fullText,
      klingPack.shot4.fullText,
    ],
    seedanceShots: [
      seedancePack.shot1.fullText,
      seedancePack.shot2.fullText,
      seedancePack.shot3.fullText,
      seedancePack.shot4.fullText,
    ],
    seedanceMultiShotPrompt: seedancePack.multiShotPrompt.fullText,
    seedanceWorkflowGuide: seedancePack.workflowGuide,
    klingNative15s: klingNative15sCard.fullText,
    klingSixShot: klingSixShotCard.fullText,
    motionStrength,
    capCutPlan,
    clipChaining,
    hook: input.finalHook,
    hook2026: input.finalHook2026 ?? [],
    recommendedHookIndex: input.recommendedHookIndex,
    caption: input.shortCaption ?? "",
    caption2026: input.longCaption ?? "",
    cta,
    hashtags: input.hashtags,
    tags: input.tags,
    tenIdeas,
    shotPlan: [
      {
        engine: "RUNWAY",
        title: primaryShotTitles[0],
        prompt: fourShotWorkflowPack.shot1.fullText,
        motionStrength,
        durationLabel: primaryShotDurations[0],
        why: primaryShotWhy[0],
      },
      {
        engine: "KLING",
        title: primaryShotTitles[1],
        prompt: fourShotWorkflowPack.shot2.fullText,
        motionStrength,
        durationLabel: primaryShotDurations[1],
        why: primaryShotWhy[1],
      },
      {
        engine: "KLING",
        title: primaryShotTitles[2],
        prompt: fourShotWorkflowPack.shot3.fullText,
        motionStrength,
        durationLabel: primaryShotDurations[2],
        why: primaryShotWhy[2],
      },
      {
        engine: "RUNWAY",
        title: primaryShotTitles[3],
        prompt: fourShotWorkflowPack.shot4.fullText,
        motionStrength,
        durationLabel: primaryShotDurations[3],
        why: primaryShotWhy[3],
      },
    ],
    runwayBundle: [
      runwayPack.shot1.fullText,
      runwayPack.shot2.fullText,
      runwayPack.shot3.fullText,
      runwayPack.shot4.fullText,
    ].join("\n\n---\n\n"),
    klingBundle: [
      klingPack.shot1.fullText,
      klingPack.shot2.fullText,
      klingPack.shot3.fullText,
      klingPack.shot4.fullText,
    ].join("\n\n---\n\n"),
    routingNote:
      input.selectedPipelineStyle === "long-hybrid-4-shot"
        ? `Primary workflow: true 50-second hybrid 4-shot routing uses Runway ${input.runwayModel} for Shot 1 (10s) and Shot 4 (10s), and Kling ${input.klingModel} for Shot 2 (15s) and Shot 3 (15s). Long lane holds the setup longer, builds pressure more gradually, lands one clearer payoff beat, and preserves a cleaner aftermath resolve.`
        : `Primary workflow: hybrid 4-shot routing uses Runway ${input.runwayModel} for Shots 1 and 4, and Kling ${input.klingModel} for Shots 2 and 3. Optional bundles: Seedance 2.0, full Runway 4-shot, and full Kling 4-shot outputs remain available.`,
    pipelineStyle: input.selectedPipelineStyle,
    fiveShotCinematic,
    fiveShotViral,
    watchTimeReport,
    platformPack,
    seoTitle,
    altTextPrompt,
    qualitySummary,
    referenceWorkflow,
    naturalismChecklist,
    modelsUsed: { runway: input.runwayModel, kling: input.klingModel },
    sceneDesc: input.sceneInject,
    soundDesignPack,
    animalBehavior: animalBehaviorResult ?? undefined,
  };

  const capCutScript = buildCapCutScript(
    input.predator,
    input.prey,
    input.finalArc,
    input.weather,
    basePkg,
    input.selectedPipelineStyle
  );
  const twoPartViralPreset =
    shouldBuildTwoPartViralPreset(input.predator, input.prey, input.finalArc)
      ? buildTwoPartViralPreset(
          input.predator,
          input.prey,
          input.finalEnvironment,
          input.weather,
          input.finalArc,
          input.runwayModel
        )
      : null;

  return {
    basePkg,
    capCutScript,
    twoPartViralPreset,
    marketMode: input.marketMode,
    durationLane: input.durationLane,
    fastPublishMode: input.fastPublishMode,
    strictOriginalityGuard: input.strictOriginalityGuard,
    hookFamily: input.hookFamily,
    finalEnvironment: input.finalEnvironment,
    openingFrameInput: input.openingFrameInput,
    usAudienceScore: input.usAudienceScore,
    openingFrameScore: input.openingFrameScore,
    performanceSnapshot: input.performanceSnapshot ?? undefined,
    primaryHook: input.finalHook,
  };
}

export function finalizeGeneratedPackageDraft(
  draft: GeneratedPackageDraft,
  enhanced: GeneratedPackageEnhancements = {}
): { finalPkg: GeneratedPackage; publishFlowSummary: PublishFlowSummary } {
  const finalShortCaption =
    typeof enhanced.caption === "string" && enhanced.caption.trim().length > 0
      ? enhanced.caption
      : draft.basePkg.caption;
  const finalPublishCaption =
    draft.fastPublishMode || draft.durationLane === "short"
      ? finalShortCaption
      : draft.basePkg.caption2026;

  const finalUsViewsModeReport = buildUSViewsModeReport({
    durationLane: draft.durationLane,
    hookFamily: draft.hookFamily,
    concept: {
      predator: draft.basePkg.predatorName ?? "",
      prey: draft.basePkg.preyName ?? "",
      environment: draft.finalEnvironment,
      arc: draft.basePkg.arcName as Arc,
    },
    openingFrame: draft.openingFrameInput,
    caption: finalPublishCaption,
    hashtags: draft.basePkg.hashtags.split(/\s+/).filter(Boolean),
    originalityConfirmed: draft.strictOriginalityGuard,
    audienceScore: draft.usAudienceScore,
    openingFrameScore: draft.openingFrameScore,
    performanceSnapshot: draft.performanceSnapshot,
  });

  const finalPkg = mergeGeneratedPackage(draft.basePkg, enhanced, {
    capCutScript: draft.capCutScript,
    durationLane: draft.durationLane,
    hookFamily: finalUsViewsModeReport.hookFamily,
    usAudienceScore: draft.usAudienceScore,
    openingFrameScore: draft.openingFrameScore,
    publishGuardReport: finalUsViewsModeReport.publishGuard,
    performanceSnapshot: finalUsViewsModeReport.performanceSnapshot,
    usViewsModeReport: finalUsViewsModeReport,
    ...(draft.twoPartViralPreset
      ? {
          twoPartViralOverview: draft.twoPartViralPreset.overview,
          twoPartWorkflowGuide: draft.twoPartViralPreset.workflowGuide,
          twoPartPart1Hook: draft.twoPartViralPreset.part1Hook,
          twoPartPart1Caption: draft.twoPartViralPreset.part1Caption,
          twoPartPart1Draft: draft.twoPartViralPreset.part1Draft,
          twoPartPart1Final: draft.twoPartViralPreset.part1Final,
          twoPartPart2Hook: draft.twoPartViralPreset.part2Hook,
          twoPartPart2Caption: draft.twoPartViralPreset.part2Caption,
          twoPartPart2Draft: draft.twoPartViralPreset.part2Draft,
          twoPartPart2Final: draft.twoPartViralPreset.part2Final,
        }
      : {}),
  });

  return {
    finalPkg,
    publishFlowSummary: {
      predatorName: draft.basePkg.predatorName ?? "",
      preyName: draft.basePkg.preyName ?? "",
      arcName: draft.basePkg.arcName as Arc,
      marketMode: draft.marketMode,
      durationLane: draft.durationLane,
      hookFamily: finalUsViewsModeReport.hookFamily,
      fastPublishMode: draft.fastPublishMode,
      strictOriginalityGuard: draft.strictOriginalityGuard,
      pipelineStyle: finalPkg.pipelineStyle ?? "4-shot",
      primaryHook: draft.primaryHook,
      usAudienceScore: draft.usAudienceScore,
      openingFrameScore: draft.openingFrameScore,
      publishGuardReport: finalUsViewsModeReport.publishGuard,
      publishWorthy: finalUsViewsModeReport.shouldPublish,
    },
  };
}
