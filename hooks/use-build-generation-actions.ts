"use client";

import { useRef, type Dispatch, type SetStateAction } from "react";

import type { PromotedVariantPublishCopyOverride } from "@/hooks/use-concept-variant-lab";
import type { DurationLaneMode, MarketMode } from "@/hooks/use-build-preview";
import type {
  AIProvider,
  ActionStylePreset,
  AnimalVibe,
  Arc,
  CameraAnglePreset,
  ContentLane,
  DepthMode,
  EmotionalTone,
  EncounterMode,
  EndingMode,
  EscapeDirection,
  GeneratedPackage,
  HabitatRegion,
  HookFamily,
  KlingModel,
  MediaAnalysisResult,
  OffspringLabel,
  PackageLockKey,
  PackageLockState,
  PipelineStyle,
  PredatorInfo,
  PromptVersion,
  RealismMode,
  RunwayModel,
  Season,
  StoryMode,
  StrikeMethod,
  TimeOfDay,
  ViralLane,
  ViolenceLevel,
  Weather,
  WeatherHazard,
} from "@/types";
import { copyPolishEndpointResponseSchema } from "@/lib/schemas";
import {
  hasUsableGeneratedPackageEnhancements,
  type GeneratedPackageEnhancements,
} from "@/lib/generated-package";
import {
  buildGeneratedPackageDraft,
  finalizeGeneratedPackageDraft,
  type GeneratedPackageDraft,
  type PublishFlowSummary,
} from "@/lib/build-package";
import {
  appendPromptVersion,
  getNextVersionNumber,
  makePromptVersionKey,
} from "@/lib/versioning";
import {
  applyPackageSectionLocks,
  hasLockedPackageSections,
} from "@/lib/package-section-locks";

type ActivePromotedPublishCopyOverride =
  | (PromotedVariantPublishCopyOverride & { hookFamily: HookFamily })
  | null;

interface UseBuildGenerationActionsInput {
  predator: string;
  prey: string;
  storyMode: StoryMode;
  encounterMode: EncounterMode;
  endingMode: EndingMode;
  viralLane: ViralLane;
  violenceLevel: ViolenceLevel;
  habitatRegion: HabitatRegion;
  season: Season;
  timeOfDay: TimeOfDay;
  subjectA?: string;
  subjectB?: string;
  groupCount?: number;
  offspringLabel?: OffspringLabel;
  strikeMethod?: StrikeMethod;
  escapeDirection?: EscapeDirection;
  weatherHazard?: WeatherHazard;
  rutSeason?: boolean;
  foodItem?: string;
  arc: Arc;
  previewArc: Arc;
  contentLane: ContentLane;
  actionStyle: ActionStylePreset;
  cameraAnglePreset: CameraAnglePreset;
  weather: Weather;
  depthMode: DepthMode;
  emotionalTone: EmotionalTone;
  animalVibe: AnimalVibe;
  runwayModel: RunwayModel;
  klingModel: KlingModel;
  durationLane: DurationLaneMode;
  marketMode: MarketMode;
  fastPublishMode: boolean;
  strictOriginalityGuard: boolean;
  selectedPipelineStyle: PipelineStyle;
  finalEnvironment: string;
  preset: PredatorInfo;
  sceneDescription: string;
  mediaAnalysis: MediaAnalysisResult | null;
  activeProvider: AIProvider;
  autoFallback: boolean;
  activePromotedPublishCopyOverride: ActivePromotedPublishCopyOverride;
  previewHook2026: string[];
  previewPrimaryHook: string;
  previewShortCaption: string;
  previewLongCaption: string;
  previewHashtags: string;
  previewTags: string;
  previewRecommendedHookIndex: number;
  previewHookFamily: HookFamily;
  previewAudienceScore: GeneratedPackageDraft["usAudienceScore"];
  previewOpeningFrameInput: GeneratedPackageDraft["openingFrameInput"];
  previewOpeningFrameScore: GeneratedPackageDraft["openingFrameScore"];
  previewPerformanceSnapshot: GeneratedPackageDraft["performanceSnapshot"] | null;
  realismMode: RealismMode;
  motionOnlyI2V: boolean;
  referenceLock: boolean;
  singleActionRule: boolean;
  microMotion: boolean;
  heroVeo: boolean;
  pkg: GeneratedPackage | null;
  packageLocks: PackageLockState;
  setPkg: Dispatch<SetStateAction<GeneratedPackage | null>>;
  setPackageLocks: Dispatch<SetStateAction<PackageLockState>>;
  setPublishFlowSummary: Dispatch<SetStateAction<PublishFlowSummary | null>>;
  setIsGenerating: Dispatch<SetStateAction<boolean>>;
  setIsRegeneratingUnlocked: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string>>;
  setEnhancementNotice: Dispatch<SetStateAction<string | null>>;
  onGenerated: () => void;
}

export function useBuildGenerationActions({
  predator,
  prey,
  storyMode,
  encounterMode,
  endingMode,
  viralLane,
  violenceLevel,
  habitatRegion,
  season,
  timeOfDay,
  subjectA,
  subjectB,
  groupCount,
  offspringLabel,
  strikeMethod,
  escapeDirection,
  weatherHazard,
  rutSeason,
  foodItem,
  arc,
  previewArc,
  contentLane,
  actionStyle,
  cameraAnglePreset,
  weather,
  depthMode,
  emotionalTone,
  animalVibe,
  runwayModel,
  klingModel,
  durationLane,
  marketMode,
  fastPublishMode,
  strictOriginalityGuard,
  selectedPipelineStyle,
  finalEnvironment,
  preset,
  sceneDescription,
  mediaAnalysis,
  activeProvider,
  autoFallback,
  activePromotedPublishCopyOverride,
  previewHook2026,
  previewPrimaryHook,
  previewShortCaption,
  previewLongCaption,
  previewHashtags,
  previewTags,
  previewRecommendedHookIndex,
  previewHookFamily,
  previewAudienceScore,
  previewOpeningFrameInput,
  previewOpeningFrameScore,
  previewPerformanceSnapshot,
  realismMode,
  motionOnlyI2V,
  referenceLock,
  singleActionRule,
  microMotion,
  heroVeo,
  pkg,
  packageLocks,
  setPkg,
  setPackageLocks,
  setPublishFlowSummary,
  setIsGenerating,
  setIsRegeneratingUnlocked,
  setError,
  setEnhancementNotice,
  onGenerated,
}: UseBuildGenerationActionsInput) {
  const activeGenerationIdRef = useRef(0);
  // WSTV-AUDIT-FIX: FIX-4 applied
  const latestGenerateRequestIdRef = useRef(0);
  const latestRegenerateRequestIdRef = useRef(0);
  function handleTogglePackageLock(key: PackageLockKey) {
    setPackageLocks((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function buildCurrentPackageDraft(sceneInjectOverride?: string) {
    if (!predator || !prey) throw new Error("Missing predator or prey");

    const sceneInjectFromMedia = mediaAnalysis?.imagePromptInject ?? "";
    const sceneInjectFromUser = sceneDescription.trim();
    const sceneInject =
      sceneInjectOverride ??
      (sceneInjectFromUser.length > 0
        ? sceneInjectFromUser
        : sceneInjectFromMedia);
    const quality = {
      realismMode,
      motionOnlyI2V,
      referenceLock,
      singleActionRule,
      microMotion,
      heroVeo,
      actionStyle,
    };

    return buildGeneratedPackageDraft({
      predator,
      prey,
      presetLighting: preset.lighting,
      presetCameraGear: preset.cameraGear,
      presetTexture: preset.texture,
      presetDriftRisk: preset.driftRisk,
      presetForIdeas: { ...preset, environment: finalEnvironment } as PredatorInfo,
      finalEnvironment,
      finalArc: previewArc,
      contentLane,
      cameraAnglePreset,
      weather,
      depthMode,
      emotionalTone,
      animalVibe,
      runwayModel,
      klingModel,
      durationLane,
      marketMode,
      fastPublishMode,
      strictOriginalityGuard,
      selectedPipelineStyle,
      sceneInject,
      quality,
      finalHook2026: activePromotedPublishCopyOverride
        ? [
            activePromotedPublishCopyOverride.hook,
            ...previewHook2026.filter(
              (hook) => hook !== activePromotedPublishCopyOverride.hook
            ),
          ]
        : previewHook2026,
      finalHook:
        activePromotedPublishCopyOverride?.hook ??
        previewPrimaryHook ??
        previewHook2026[0] ??
        "",
      shortCaption:
        activePromotedPublishCopyOverride?.caption ?? previewShortCaption,
      longCaption:
        activePromotedPublishCopyOverride?.caption ?? previewLongCaption,
      hashtags: activePromotedPublishCopyOverride?.hashtags ?? previewHashtags,
      tags: previewTags,
      recommendedHookIndex: previewRecommendedHookIndex,
      hookFamily: previewHookFamily,
      usAudienceScore: previewAudienceScore,
      openingFrameInput: previewOpeningFrameInput,
      openingFrameScore: previewOpeningFrameScore,
      performanceSnapshot: previewPerformanceSnapshot,
      storyMode,
      encounterMode,
      endingMode,
      viralLane,
      violenceLevel,
      habitatRegion,
      season,
      timeOfDay,
      subjectA,
      subjectB,
      groupCount,
      offspringLabel,
      strikeMethod,
      escapeDirection,
      weatherHazard,
      rutSeason,
      foodItem,
    });
  }

  async function buildEnhancementsForDraft(
    draft: GeneratedPackageDraft
  ): Promise<GeneratedPackageEnhancements> {
    if (activeProvider === "none") return {};

    const res = await fetch("/api/enhance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: activeProvider,
        autoFallback,
        predator: draft.basePkg.predatorName ?? predator,
        prey: draft.basePkg.preyName ?? prey,
        env: finalEnvironment,
        arc: previewArc,
        weather,
        emotionalTone,
        animalVibe,
        base: {
          imagePrompt: draft.basePkg.imagePrompt,
          hook: draft.basePkg.hook,
          caption: draft.basePkg.caption ?? "",
          voiceoverLine: draft.basePkg.voiceoverLine,
        },
      }),
    });
    const data = await res.json().catch(() => ({} as unknown));
    const parsedResponse = copyPolishEndpointResponseSchema.safeParse(data);

    if (parsedResponse.success && "skipped" in parsedResponse.data && parsedResponse.data.skipped) {
      setEnhancementNotice(parsedResponse.data.message);
      return {};
    }

    if (!res.ok) {
      throw new Error(
        ((data as Record<string, unknown>)?.error as string) ||
          `AI polish failed (${res.status})`
      );
    }
    if (!parsedResponse.success || "skipped" in parsedResponse.data) {
      throw new Error("Invalid AI polish response");
    }

    const enhanced: GeneratedPackageEnhancements = {
      ...(parsedResponse.data.imagePrompt
        ? { imagePrompt: parsedResponse.data.imagePrompt }
        : {}),
      ...(parsedResponse.data.hook ? { hook: parsedResponse.data.hook } : {}),
      ...(parsedResponse.data.caption
        ? { caption: parsedResponse.data.caption }
        : {}),
      ...(parsedResponse.data.voiceoverLine
        ? { voiceoverLine: parsedResponse.data.voiceoverLine }
        : {}),
      aiEnhanced: true,
    };

    if (!hasUsableGeneratedPackageEnhancements(enhanced)) {
      throw new Error("AI polish returned no usable prompt or copy updates");
    }

    return enhanced;
  }

  function appendGenerationVersion(finalPkg: GeneratedPackage, labelPrefix: string) {
    try {
      const key = makePromptVersionKey(
        finalPkg.predatorName ?? predator,
        finalPkg.preyName ?? prey,
        String(finalPkg.arcName ?? arc)
      );
      const v: PromptVersion = {
        version: getNextVersionNumber(key),
        timestamp: new Date().toISOString(),
        imagePrompt: finalPkg.imagePrompt,
        hook: finalPkg.hook ?? "",
        caption: finalPkg.caption ?? "",
        voiceoverLine: finalPkg.voiceoverLine ?? "",
        label: `${labelPrefix} • ${
          activeProvider === "none" ? "Local" : activeProvider
        } • ${predator} vs ${prey} • ${String(previewArc ?? arc)}`,
        performanceNote: "",
      };
      appendPromptVersion(key, v);
    } catch {
      // ignore
    }
  }

  function syncPublishSummaryWithPackage(
    finalPkg: GeneratedPackage,
    summary: PublishFlowSummary
  ): PublishFlowSummary {
    return {
      ...summary,
      predatorName: finalPkg.predatorName ?? summary.predatorName,
      preyName: finalPkg.preyName ?? summary.preyName,
      arcName: finalPkg.arcName ?? summary.arcName,
      durationLane: finalPkg.durationLane ?? summary.durationLane,
      hookFamily: finalPkg.hookFamily ?? summary.hookFamily,
      pipelineStyle: finalPkg.pipelineStyle ?? summary.pipelineStyle,
      primaryHook: finalPkg.hook ?? summary.primaryHook,
      usAudienceScore: finalPkg.usAudienceScore ?? summary.usAudienceScore,
      openingFrameScore: finalPkg.openingFrameScore ?? summary.openingFrameScore,
      publishGuardReport:
        finalPkg.publishGuardReport ?? summary.publishGuardReport,
      publishWorthy:
        finalPkg.usViewsModeReport?.shouldPublish ?? summary.publishWorthy,
    };
  }

  async function handleGenerate() {
    const requestId = activeGenerationIdRef.current + 1;
    activeGenerationIdRef.current = requestId;
    latestGenerateRequestIdRef.current = requestId;

    setIsGenerating(true);
    setError("");
    setEnhancementNotice(null);
    try {
      const draft = buildCurrentPackageDraft();
      const enhanced = await buildEnhancementsForDraft(draft);
      const { finalPkg, publishFlowSummary } = finalizeGeneratedPackageDraft(
        draft,
        enhanced
      );

      if (activeGenerationIdRef.current !== requestId) return;

      const finalPkgWithStoryState = {
        ...finalPkg,
        storyMode,
        encounterMode,
        endingMode,
        viralLane,
        violenceLevel,
        habitatRegion,
        season,
        timeOfDay,
        subjectA,
        subjectB,
        groupCount,
        offspringLabel,
        strikeMethod,
        escapeDirection,
        weatherHazard,
        rutSeason,
        foodItem,
      };

      setPkg(finalPkgWithStoryState);
      setPublishFlowSummary(publishFlowSummary);
      appendGenerationVersion(finalPkgWithStoryState, "GENERATE");
      onGenerated();
    } catch (e) {
      console.error("[generate error]", e);
      if (activeGenerationIdRef.current !== requestId) return;
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      if (latestGenerateRequestIdRef.current === requestId) {
        setIsGenerating(false);
      }
    }
  }

  async function handleRegenerateUnlockedSections() {
    if (!pkg) return;

    const requestId = activeGenerationIdRef.current + 1;
    activeGenerationIdRef.current = requestId;
    latestRegenerateRequestIdRef.current = requestId;

    setIsRegeneratingUnlocked(true);
    setError("");
    setEnhancementNotice(null);
    try {
      const sceneInjectOverride = packageLocks.sceneDescription
        ? pkg.sceneDesc ?? ""
        : undefined;
      const draft = buildCurrentPackageDraft(sceneInjectOverride);
      const enhanced = await buildEnhancementsForDraft(draft);
      const { finalPkg: candidatePkg, publishFlowSummary } =
        finalizeGeneratedPackageDraft(draft, enhanced);
      const finalPkg = hasLockedPackageSections(packageLocks)
        ? applyPackageSectionLocks(pkg, candidatePkg, packageLocks)
        : candidatePkg;

      if (activeGenerationIdRef.current !== requestId) return;

      const finalPkgWithStoryState = {
        ...finalPkg,
        storyMode,
        encounterMode,
        endingMode,
        viralLane,
        violenceLevel,
        habitatRegion,
        season,
        timeOfDay,
        subjectA,
        subjectB,
        groupCount,
        offspringLabel,
        strikeMethod,
        escapeDirection,
        weatherHazard,
        rutSeason,
        foodItem,
      };

      setPkg(finalPkgWithStoryState);
      setPublishFlowSummary(
        syncPublishSummaryWithPackage(finalPkgWithStoryState, publishFlowSummary)
      );
      appendGenerationVersion(finalPkgWithStoryState, "REGENERATE UNLOCKED");
      onGenerated();
    } catch (e) {
      console.error("[regenerate unlocked error]", e);
      if (activeGenerationIdRef.current !== requestId) return;
      setError(e instanceof Error ? e.message : "Regeneration failed");
    } finally {
      if (latestRegenerateRequestIdRef.current === requestId) {
        setIsRegeneratingUnlocked(false);
      }
    }
  }

  function handleRestoreVersion(version: PromptVersion) {
    setPkg((prev) => {
      if (!prev) return prev;

      const restored: GeneratedPackage = {
        ...prev,
        imagePrompt: version.imagePrompt,
        hook: version.hook,
        caption: version.caption,
        voiceoverLine: version.voiceoverLine ?? prev.voiceoverLine,
      };

      try {
        const key = makePromptVersionKey(
          restored.predatorName ?? predator,
          restored.preyName ?? prey,
          String(restored.arcName ?? arc)
        );
        appendPromptVersion(key, {
          version: getNextVersionNumber(key),
          timestamp: new Date().toISOString(),
          imagePrompt: restored.imagePrompt,
          hook: restored.hook ?? "",
          caption: restored.caption ?? "",
          voiceoverLine: restored.voiceoverLine ?? "",
          label: `RESTORE v${version.version} • ${predator} vs ${prey}`,
          performanceNote: "",
        });
      } catch {
        // ignore
      }

      return restored;
    });
  }

  return {
    handleGenerate,
    handleRegenerateUnlockedSections,
    handleRestoreVersion,
    handleTogglePackageLock,
  };
}
