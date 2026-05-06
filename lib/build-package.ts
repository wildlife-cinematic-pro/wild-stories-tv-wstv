import type {
  Arc,
  AnimalVibe,
  CameraAnglePreset,
  CapCutScript,
  ContentLane,
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
  buildGptImage2PromptCard,
  buildFourShotWorkflowPromptPack,
  buildSeedancePromptPack,
  buildShotImagePlan,
  buildRunwayPromptPack,
  buildKlingPromptPack,
  buildKlingFramesPromptCard,
  buildKlingMultishotPromptCards,
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
import {
  buildDurationLaneRoutingNote,
  getDurationLaneConfig,
} from "@/lib/duration-lanes";

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

const FACEBOOK_AI_DISCLOSURE_REMINDER =
  "⚠️ Reminder: Label this content as AI-generated before publishing to comply with Meta policy and SynthID detection.";

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
  contentLane: ContentLane;
  cameraAnglePreset: CameraAnglePreset;
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
  contentLane: ContentLane;
  cameraAnglePreset: CameraAnglePreset;
  generationId: string;
  generatedAt: string;
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

function buildPrimaryShotTitles(durationLane: DurationLane): string[] {
  return getDurationLaneConfig(durationLane).shots.map((shot) => shot.title);
}

function buildPackageGenerationId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `gen_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildPrimaryShotWhy(durationLane: DurationLane): string[] {
  return getDurationLaneConfig(durationLane).shots.map((shot) => shot.why);
}

export function buildGeneratedPackageDraft(
  input: GeneratedPackageDraftInput
): GeneratedPackageDraft {
  const generatedAt = new Date().toISOString();
  const generationId = buildPackageGenerationId();

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
    "NANO_BANANA_2",
    input.cameraAnglePreset
  );
  const gptImage2PromptCard = buildGptImage2PromptCard(
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
    input.cameraAnglePreset
  );
  const shotImagePlan = buildShotImagePlan(
    input.predator,
    input.prey,
    input.finalEnvironment,
    input.finalArc,
    input.weather,
    input.quality,
    input.cameraAnglePreset
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
    input.quality,
    input.cameraAnglePreset
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
    input.quality,
    input.cameraAnglePreset
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
    cameraAnglePreset: input.cameraAnglePreset,
  });
  const klingFramesPromptCard = buildKlingFramesPromptCard(
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
  const klingMultishotCards = buildKlingMultishotPromptCards(
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
    input.finalEnvironment,
    input.contentLane,
    input.finalHook
  );
  platformPack.facebook.publishReminders = [
    ...new Set([
      ...(platformPack.facebook.publishReminders ?? []),
      FACEBOOK_AI_DISCLOSURE_REMINDER,
    ]),
  ];
  const primaryHook = platformPack.facebook.hook;
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
  const durationLaneConfig = getDurationLaneConfig(input.durationLane);
  const primaryShotTitles = buildPrimaryShotTitles(input.durationLane);
  const primaryShotWhy = buildPrimaryShotWhy(input.durationLane);
  const primaryShotGenerationLabels = durationLaneConfig.shots.map(
    (shot) => `Generation duration: ${shot.generationSeconds}s`
  );
  const primaryShotEditLabels = durationLaneConfig.shots.map(
    (shot) => `Edit timeline: ${shot.editTimeline}`
  );

  const basePkg: GeneratedPackage = {
    predatorName: input.predator,
    preyName: input.prey,
    arcName: input.finalArc,
    environmentName: input.finalEnvironment,
    weatherName: input.weather,
    cameraAnglePreset: input.cameraAnglePreset,
    generationId,
    generatedAt,
    imagePrompt: imagePromptCard.fullText,
    gptImage2Prompt: gptImage2PromptCard.fullText,
    negativePrompt: negativePromptForKling,
    thumbnailPrompt,
    voiceoverLine,
    shotImagePlan,
    structuredPrompts: {
      imagePrompt: imagePromptCard,
      gptImage2Prompt: gptImage2PromptCard,
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
      klingFramesPrompt: klingFramesPromptCard,
      klingMultishotShots: klingMultishotCards,
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
    klingFramesPrompt: klingFramesPromptCard.fullText,
    klingMultishotShots: klingMultishotCards.map((card) => card.fullText),
    klingSixShot: klingSixShotCard.fullText,
    motionStrength,
    capCutPlan,
    clipChaining,
    hook: primaryHook,
    hook2026: input.finalHook2026 ?? [],
    recommendedHookIndex: input.recommendedHookIndex,
    caption: input.shortCaption ?? "",
    caption2026: input.longCaption ?? "",
    pinnedComment: platformPack.facebook.pinnedComment,
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
        durationLabel: primaryShotEditLabels[0],
        generationDurationLabel: primaryShotGenerationLabels[0],
        editTimelineLabel: primaryShotEditLabels[0],
        why: primaryShotWhy[0],
      },
      {
        engine: "KLING",
        title: primaryShotTitles[1],
        prompt: fourShotWorkflowPack.shot2.fullText,
        motionStrength,
        durationLabel: primaryShotEditLabels[1],
        generationDurationLabel: primaryShotGenerationLabels[1],
        editTimelineLabel: primaryShotEditLabels[1],
        why: primaryShotWhy[1],
      },
      {
        engine: "KLING",
        title: primaryShotTitles[2],
        prompt: fourShotWorkflowPack.shot3.fullText,
        motionStrength,
        durationLabel: primaryShotEditLabels[2],
        generationDurationLabel: primaryShotGenerationLabels[2],
        editTimelineLabel: primaryShotEditLabels[2],
        why: primaryShotWhy[2],
      },
      {
        engine: "RUNWAY",
        title: primaryShotTitles[3],
        prompt: fourShotWorkflowPack.shot4.fullText,
        motionStrength,
        durationLabel: primaryShotEditLabels[3],
        generationDurationLabel: primaryShotGenerationLabels[3],
        editTimelineLabel: primaryShotEditLabels[3],
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
    routingNote: buildDurationLaneRoutingNote(
      input.durationLane,
      input.runwayModel,
      input.klingModel
    ),
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
    contentLane: input.contentLane,
    cameraAnglePreset: input.cameraAnglePreset,
    generationId,
    generatedAt,
    fastPublishMode: input.fastPublishMode,
    strictOriginalityGuard: input.strictOriginalityGuard,
    hookFamily: input.hookFamily,
    finalEnvironment: input.finalEnvironment,
    openingFrameInput: input.openingFrameInput,
    usAudienceScore: input.usAudienceScore,
    openingFrameScore: input.openingFrameScore,
    performanceSnapshot: input.performanceSnapshot ?? undefined,
    primaryHook,
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
    contentLane: draft.contentLane,
    concept: {
      predator: draft.basePkg.predatorName ?? "",
      prey: draft.basePkg.preyName ?? "",
      environment: draft.finalEnvironment,
      arc: draft.basePkg.arcName as Arc,
      contentLane: draft.contentLane,
    },
    openingFrame: draft.openingFrameInput,
    hookText:
      typeof enhanced.hook === "string" && enhanced.hook.trim().length > 0
        ? enhanced.hook
        : draft.primaryHook,
    ctaText: draft.basePkg.cta,
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
      primaryHook: finalPkg.hook ?? draft.primaryHook,
      // WSTV-AUDIT-FIX: FIX-3 applied
      usAudienceScore: draft.usAudienceScore,
      openingFrameScore: draft.openingFrameScore,
      publishGuardReport: finalUsViewsModeReport.publishGuard,
      publishWorthy: finalUsViewsModeReport.shouldPublish,
    },
  };
}
