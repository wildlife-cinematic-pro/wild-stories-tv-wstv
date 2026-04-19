"use client";

import { useEffect, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";

import { buildOpeningFrameInput } from "@/lib/build-package";
import {
  buildAutoSceneDescription,
  normalizeArcSuggestion,
  normalizeDepthSuggestion,
  normalizePreset,
  normalizeWeatherSuggestion,
  type NormalizedPreset,
} from "@/lib/page-build-helpers";
import {
  build2026Hook,
  build2026HookByFamily,
  buildHashtags,
  buildLongCaption,
  buildShortCaption,
  buildTags,
} from "@/lib/platform-packs";
import {
  predatorData,
  suggestArc,
  suggestHabitat,
} from "@/lib/predator-data";
import { getQualityRecommendations } from "@/lib/recommendations";
import { buildUSViewsModeReport } from "@/lib/usViewsMode";
import { habitatPromptMap } from "@/lib/habitat-presets";

import type {
  Arc,
  CustomPredatorForm,
  DepthMode,
  DurationLane,
  HabitatPreset,
  HookFamily,
  KlingModel,
  MediaAnalysisResult,
  PipelineStyle,
  RealismMode,
  RunwayModel,
  Weather,
} from "@/types";

export type DurationLaneMode = DurationLane;
export type HookMode = HookFamily | "all";
export type MarketMode = "US_ONLY";
export type SceneDescriptionMode = "auto" | "manual";

const HOOK_FAMILY_ORDER: HookFamily[] = ["danger", "curiosity", "reversal"];

type UseBuildPreviewInput = {
  predator: string;
  prey: string;
  arc: Arc;
  habitat: HabitatPreset;
  weather: Weather;
  depthMode: DepthMode;
  customPredators: CustomPredatorForm[];
  mediaAnalysis: MediaAnalysisResult | null;
  sceneDescriptionMode: SceneDescriptionMode;
  sceneDescriptionTouched: boolean;
  sceneDescriptionVariant: number;
  durationLane: DurationLaneMode;
  marketMode: MarketMode;
  hookMode: HookMode;
  fastPublishMode: boolean;
  strictOriginalityGuard: boolean;
  realismMode: RealismMode;
  runwayModel: RunwayModel;
  klingModel: KlingModel;
  motionOnlyI2V: boolean;
  referenceLock: boolean;
  singleActionRule: boolean;
  microMotion: boolean;
  heroVeo: boolean;
  setPrey: Dispatch<SetStateAction<string>>;
  setArc: Dispatch<SetStateAction<Arc>>;
  setWeather: Dispatch<SetStateAction<Weather>>;
  setDepthMode: Dispatch<SetStateAction<DepthMode>>;
  setSceneDescription: Dispatch<SetStateAction<string>>;
  setSceneDescriptionMode: Dispatch<SetStateAction<SceneDescriptionMode>>;
  setSceneDescriptionTouched: Dispatch<SetStateAction<boolean>>;
  setSceneDescriptionVariant: Dispatch<SetStateAction<number>>;
};

export function useBuildPreview({
  predator,
  prey,
  arc,
  habitat,
  weather,
  depthMode,
  customPredators,
  mediaAnalysis,
  sceneDescriptionMode,
  sceneDescriptionTouched,
  sceneDescriptionVariant,
  durationLane,
  marketMode,
  hookMode,
  fastPublishMode,
  strictOriginalityGuard,
  realismMode,
  runwayModel,
  klingModel,
  motionOnlyI2V,
  referenceLock,
  singleActionRule,
  microMotion,
  heroVeo,
  setPrey,
  setArc,
  setWeather,
  setDepthMode,
  setSceneDescription,
  setSceneDescriptionMode,
  setSceneDescriptionTouched,
  setSceneDescriptionVariant,
}: UseBuildPreviewInput) {
  const lionFallback = useMemo<NormalizedPreset>(() => {
    const rawLion = (predatorData as Record<string, unknown>)["Lion"];

    return normalizePreset(rawLion, {
      prey: ["White-tailed Deer"],
      environment: habitatPromptMap["Rocky Mountain Meadow"],
      lighting:
        "cold dawn light, pale gold horizon glow, thin ground mist, soft natural side light",
      cameraGear: "Nikon Z9, 400mm wildlife lens, long-lens documentary framing",
      texture:
        "natural fur, feather, or scale detail, grounded body weight, realistic contact with dirt, grass, brush, and uneven terrain",
      driftRisk: "MEDIUM",
      defaultArc: "Ambush attack",
    });
  }, []);

  const preset = useMemo<NormalizedPreset>(() => {
    const raw = (predatorData as Record<string, unknown>)[predator];
    if (raw !== undefined) return normalizePreset(raw, lionFallback);

    const custom = customPredators.find((item) => item.name === predator);
    if (!custom) return lionFallback;

    const preyList = custom.prey
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    return normalizePreset(
      {
        prey: preyList.length ? preyList : ["White-tailed Deer"],
        environment: custom.environment || "Rocky Mountain forest edge and open meadow",
        lighting:
          "cold dawn light, pale gold horizon glow, thin ground mist, soft natural side light",
        cameraGear:
          "Nikon Z9, 400mm wildlife lens, long-lens documentary framing",
        texture:
          "natural fur, feather, or scale detail, grounded body weight, realistic contact with dirt, grass, brush, and uneven terrain",
        driftRisk: custom.driftRisk || "MEDIUM",
        defaultArc: custom.defaultArc || "Pack hunting strategy",
      },
      lionFallback
    );
  }, [predator, lionFallback, customPredators]);

  const finalEnvironment =
    habitat === "Auto"
      ? suggestHabitat(predator, prey, preset.environment)
      : habitatPromptMap[habitat];

  const mediaSuggestedArc = useMemo(
    () => normalizeArcSuggestion(mediaAnalysis?.suggestedArc),
    [mediaAnalysis?.suggestedArc]
  );

  const previewArc = useMemo(
    () => suggestArc(predator, prey, arc) as Arc,
    [predator, prey, arc]
  );

  const autoSceneDescription = useMemo(
    () =>
      buildAutoSceneDescription({
        predator,
        prey,
        arc: previewArc,
        habitat,
        environment: finalEnvironment,
        variant: sceneDescriptionVariant,
      }),
    [predator, prey, previewArc, habitat, finalEnvironment, sceneDescriptionVariant]
  );

  useEffect(() => {
    if (!(sceneDescriptionMode === "auto" || !sceneDescriptionTouched)) return;

    setSceneDescription((current) =>
      current === autoSceneDescription ? current : autoSceneDescription
    );
  }, [
    autoSceneDescription,
    sceneDescriptionMode,
    sceneDescriptionTouched,
    setSceneDescription,
  ]);

  function applyAutoSceneDescription(variant: number) {
    const nextDescription = buildAutoSceneDescription({
      predator,
      prey,
      arc: previewArc,
      habitat,
      environment: finalEnvironment,
      variant,
    });

    setSceneDescriptionVariant(variant);
    setSceneDescription(nextDescription);
    setSceneDescriptionMode("auto");
    setSceneDescriptionTouched(false);
  }

  function handleSceneDescriptionChange(value: string) {
    setSceneDescription(value);
    setSceneDescriptionMode("manual");
    setSceneDescriptionTouched(true);
  }

  function handleSceneDescriptionRegenerate() {
    applyAutoSceneDescription(sceneDescriptionVariant + 1);
  }

  useEffect(() => {
    if (!mediaAnalysis) return;

    const nextWeather = normalizeWeatherSuggestion(mediaAnalysis.weather);
    const nextDepthMode = normalizeDepthSuggestion(mediaAnalysis.suggestedDepth);

    if (nextWeather && weather !== nextWeather) setWeather(nextWeather);
    if (nextDepthMode && depthMode !== nextDepthMode) setDepthMode(nextDepthMode);
  }, [mediaAnalysis, weather, depthMode, setWeather, setDepthMode]);

  useEffect(() => {
    if (!preset.prey.length) return;

    const nextPrey = preset.prey.includes(prey) ? prey : preset.prey[0];
    if (prey !== nextPrey) {
      setPrey(nextPrey);
      return;
    }

    const suggestedArc =
      mediaSuggestedArc ?? (suggestArc(predator, nextPrey, preset.defaultArc) as Arc);
    if (arc !== suggestedArc) setArc(suggestedArc);
  }, [
    predator,
    prey,
    arc,
    preset.prey,
    preset.defaultArc,
    mediaSuggestedArc,
    setPrey,
    setArc,
  ]);

  const selectedPipelineStyle: PipelineStyle =
    durationLane === "long" ? "long-hybrid-4-shot" : "4-shot";
  const captionMode = marketMode === "US_ONLY" ? "us-only" : "default";
  const previewHooks = useMemo(
    () => build2026Hook(predator, prey, previewArc),
    [predator, prey, previewArc]
  );
  const previewShortCaption = useMemo(
    () =>
      buildShortCaption(predator, prey, finalEnvironment, previewArc, {
        mode: captionMode,
      }),
    [predator, prey, finalEnvironment, previewArc, captionMode]
  );
  const previewLongCaption = useMemo(
    () =>
      buildLongCaption(predator, prey, finalEnvironment, previewArc, {
        mode: captionMode,
      }),
    [predator, prey, finalEnvironment, previewArc, captionMode]
  );
  const previewCaption = useMemo(
    () =>
      fastPublishMode || durationLane === "short"
        ? previewShortCaption
        : previewLongCaption,
    [fastPublishMode, durationLane, previewShortCaption, previewLongCaption]
  );
  const previewHashtags = useMemo(
    () =>
      buildHashtags(predator, prey, previewArc, {
        count: 5,
      }),
    [predator, prey, previewArc]
  );
  const previewTags = useMemo(
    () => buildTags(predator, prey, previewArc),
    [predator, prey, previewArc]
  );
  const previewHashtagList = useMemo(
    () => previewHashtags.split(/\s+/).filter(Boolean),
    [previewHashtags]
  );
  const previewOpeningFrameInput = useMemo(
    () =>
      buildOpeningFrameInput(
        previewArc,
        depthMode,
        motionOnlyI2V,
        referenceLock,
        singleActionRule,
        fastPublishMode,
        hookMode
      ),
    [
      previewArc,
      depthMode,
      motionOnlyI2V,
      referenceLock,
      singleActionRule,
      fastPublishMode,
      hookMode,
    ]
  );
  const previewUSViewsModeReport = useMemo(
    () =>
      buildUSViewsModeReport({
        durationLane,
        hookFamily: hookMode === "all" ? undefined : hookMode,
        concept: {
          predator,
          prey,
          environment: finalEnvironment,
          arc: previewArc,
        },
        openingFrame: previewOpeningFrameInput,
        caption: previewCaption,
        hashtags: previewHashtagList,
        originalityConfirmed: strictOriginalityGuard,
      }),
    [
      durationLane,
      hookMode,
      predator,
      prey,
      finalEnvironment,
      previewArc,
      previewOpeningFrameInput,
      previewCaption,
      previewHashtagList,
      strictOriginalityGuard,
    ]
  );
  const previewHookFamily = previewUSViewsModeReport.hookFamily;
  const previewPrimaryHook = useMemo(
    () => build2026HookByFamily(predator, prey, previewArc, previewHookFamily),
    [predator, prey, previewArc, previewHookFamily]
  );
  const previewHook2026 = useMemo(
    () => [
      previewPrimaryHook,
      ...previewHooks.filter((hook) => hook !== previewPrimaryHook),
    ],
    [previewHooks, previewPrimaryHook]
  );
  const previewRecommendedHookIndex = useMemo(
    () => Math.max(0, HOOK_FAMILY_ORDER.indexOf(previewHookFamily)),
    [previewHookFamily]
  );
  const previewOpeningFrameScore = previewUSViewsModeReport.openingFrameScore;
  const previewPublishGuardReport = previewUSViewsModeReport.publishGuard;
  const previewPerformanceSnapshot = previewUSViewsModeReport.performanceSnapshot;
  const previewAudienceScore = previewUSViewsModeReport.audienceScore;

  const qualityReco = useMemo(
    () =>
      getQualityRecommendations({
        driftRisk: preset.driftRisk,
        realismMode,
        runwayModel,
        klingModel,
        durationLane,
        hookFamily: previewHookFamily,
        performance: previewPerformanceSnapshot,
        motionOnlyI2V,
        referenceLock,
        singleActionRule,
        microMotion,
        heroVeo,
        concept: {
          predator,
          prey,
          environment: finalEnvironment,
          arc: previewArc,
        },
        openingFrame: previewOpeningFrameInput,
        packaging: {
          caption: previewCaption,
          hashtags: previewHashtagList,
          originalityConfirmed: strictOriginalityGuard,
        },
      }),
    [
      preset.driftRisk,
      realismMode,
      runwayModel,
      klingModel,
      durationLane,
      previewHookFamily,
      previewPerformanceSnapshot,
      motionOnlyI2V,
      referenceLock,
      singleActionRule,
      microMotion,
      heroVeo,
      predator,
      prey,
      finalEnvironment,
      previewArc,
      previewOpeningFrameInput,
      previewCaption,
      previewHashtagList,
      strictOriginalityGuard,
    ]
  );

  return {
    preset,
    finalEnvironment,
    previewArc,
    selectedPipelineStyle,
    previewHook2026,
    previewPrimaryHook,
    previewShortCaption,
    previewLongCaption,
    previewHashtags,
    previewTags,
    previewRecommendedHookIndex,
    previewOpeningFrameInput,
    previewOpeningFrameScore,
    previewPublishGuardReport,
    previewPerformanceSnapshot,
    previewAudienceScore,
    previewHookFamily,
    qualityReco,
    applyAutoSceneDescription,
    handleSceneDescriptionChange,
    handleSceneDescriptionRegenerate,
  };
}
