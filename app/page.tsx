"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import type {
  AIProvider,
  Arc,
  CameraAnglePreset,
  DepthMode,
  ContentLane,
  EmotionalTone,
  AnimalVibe,
  Weather,
  RealismMode,
  BuildWorkflowPresetSnapshot,
  GeneratedPackage,
  MediaAnalysisResult,
  PackageLockState,
  RunwayModel,
  KlingModel,
  HabitatPreset,
  HookFamily,
  WildlifeScopeMode,
} from "@/types";

import type { PublishFlowSummary } from "@/lib/build-package";
import { createDefaultPackageLockState } from "@/lib/package-section-locks";
import {
  createLastGeneratedOutputDebouncer,
  hasShareStateInUrl,
  readLastGeneratedOutput,
  readShareState,
  shareStateMatchesWorkflowSnapshot,
  writeLastGeneratedOutput,
} from "@/lib/storage";

import {
  RUNWAY_MODELS,
  KLING_MODELS,
} from "@/lib/model-specs";
import { DEFAULT_CAMERA_ANGLE_PRESET } from "@/lib/camera-angle-presets";
import { buildStoryboardPreviewLinkMetadata } from "@/lib/storyboard-link-metadata";
import { WORKFLOW_TEST_PRESETS } from "@/lib/workflow-presets";
import { getWildlifeScopeDefaultSelection } from "@/lib/wildlife-focus";
import {
  useBuildPreview,
  type DurationLaneMode,
  type HookMode,
  type MarketMode,
  type SceneDescriptionMode,
} from "@/hooks/use-build-preview";
import { useBuildPersistence } from "@/hooks/use-build-persistence";
import { useBuildGenerationActions } from "@/hooks/use-build-generation-actions";
import {
  useConceptVariantLab,
  type PromotedVariantPublishCopyOverride,
} from "@/hooks/use-concept-variant-lab";
import { useCustomAnimals } from "@/hooks/use-custom-animals";
import { useWorkflowPresets } from "@/hooks/use-workflow-presets";

import SettingsDrawer from "@/components/SettingsDrawer";
import WSTVWorkflowDiagram from "@/components/WSTVWorkflowDiagram";
import RunwayOfficialWorkflowDiagram from "@/components/RunwayOfficialWorkflowDiagram";
import CustomAnimalModal from "@/components/build/custom-animal-modal";
import Step1Setup from "@/components/build/step-1-setup";
import Step2EngineQuality from "@/components/build/step-2-engine-quality";
import Step3Generate from "@/components/build/step-3-generate";

type Step = 1 | 2 | 3;
type TopTab = "build" | "workflows";
type WorkflowTab = "wstv" | "runway";

type QualityState = {
  realismMode: RealismMode;
  motionOnlyI2V: boolean;
  referenceLock: boolean;
  singleActionRule: boolean;
  microMotion: boolean;
  heroVeo: boolean;
};

type ActivePromotedPublishCopyOverride = PromotedVariantPublishCopyOverride & {
  hookFamily: HookFamily;
};

// ─── DEFAULTS ────────────────────────────────────────────────────────────────

const DEFAULT_PREDATOR = "Mountain Lion";
const DEFAULT_PREY = "White-tailed Deer";
const DEFAULT_WILDLIFE_SCOPE_MODE: WildlifeScopeMode = "USA / Canada Wildlife";
const DEFAULT_CONTENT_LANE: ContentLane = "Auto";
const DEFAULT_CAMERA_PRESET: CameraAnglePreset = DEFAULT_CAMERA_ANGLE_PRESET;
const DEFAULT_ARC: Arc = "Ambush attack";
const DEFAULT_WEATHER: Weather = "Golden Hour";
const DEFAULT_HABITAT: HabitatPreset = "Auto";
const DEFAULT_DEPTH_MODE: DepthMode = "Balanced Depth";
const DEFAULT_EMOTIONAL_TONE: EmotionalTone = "Raw Tension";
const DEFAULT_ANIMAL_VIBE: AnimalVibe = "National Geographic Wild";

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function Page() {
  // STEP 1
  const [predator, setPredator] = useState(DEFAULT_PREDATOR);
  const [prey, setPrey] = useState(DEFAULT_PREY);
  const [wildlifeScopeMode, setWildlifeScopeMode] = useState<WildlifeScopeMode>(
    DEFAULT_WILDLIFE_SCOPE_MODE
  );
  const [contentLane, setContentLane] = useState<ContentLane>(DEFAULT_CONTENT_LANE);
  const [cameraAnglePreset, setCameraAnglePreset] = useState<CameraAnglePreset>(
    DEFAULT_CAMERA_PRESET
  );
  const [arc, setArc] = useState<Arc>(DEFAULT_ARC);
  const [conceptArcOverride, setConceptArcOverride] = useState<Arc | null>(null);
  const [weather, setWeather] = useState<Weather>(DEFAULT_WEATHER);
  const [habitat, setHabitat] = useState<HabitatPreset>(DEFAULT_HABITAT);
  const [depthMode, setDepthMode] = useState<DepthMode>(DEFAULT_DEPTH_MODE);
  const [emotionalTone, setEmotionalTone] = useState<EmotionalTone>(DEFAULT_EMOTIONAL_TONE);
  const [animalVibe, setAnimalVibe] = useState<AnimalVibe>(DEFAULT_ANIMAL_VIBE);

  // STEP 2
  const [runwayModel, setRunwayModel] = useState<RunwayModel>(RUNWAY_MODELS[0]);
  const [klingModel, setKlingModel] = useState<KlingModel>(KLING_MODELS[0]);
  const [realismMode, setRealismMode] = useState<RealismMode>("Reference Locked");
  const [motionOnlyI2V, setMotionOnlyI2V] = useState(true);
  const [referenceLock, setReferenceLock] = useState(true);
  const [singleActionRule, setSingleActionRule] = useState(true);
  const [microMotion, setMicroMotion] = useState(true);
  const [heroVeo, setHeroVeo] = useState(false);
  const [autoApplyHighDrift, setAutoApplyHighDrift] = useState(false);
  const [lastQualityBeforeApply, setLastQualityBeforeApply] = useState<QualityState | null>(null);
  const [sceneDescription, setSceneDescription] = useState("");
  const [sceneDescriptionMode, setSceneDescriptionMode] = useState<SceneDescriptionMode>("auto");
  const [sceneDescriptionTouched, setSceneDescriptionTouched] = useState(false);
  const [sceneDescriptionVariant, setSceneDescriptionVariant] = useState(0);
  const [sceneMode, setSceneMode] = useState<"romanized" | "english">("english");
  const [mediaAnalysis, setMediaAnalysis] = useState<MediaAnalysisResult | null>(null);

  // STEP 3
  const [activeProvider, setActiveProvider] = useState<AIProvider>("none");
  const [pkg, setPkg] = useState<GeneratedPackage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegeneratingUnlocked, setIsRegeneratingUnlocked] = useState(false);
  const [enhancementNotice, setEnhancementNotice] = useState<string | null>(null);
  const [packageLocks, setPackageLocks] = useState<PackageLockState>(() =>
    createDefaultPackageLockState()
  );
  const [error, setError] = useState("");

  // Navigation
  const [step, setStep] = useState<Step>(1);
  const [activeTab, setActiveTab] = useState<TopTab>("build");
  const [workflowTab, setWorkflowTab] = useState<WorkflowTab>("wstv");

  const [marketMode] = useState<MarketMode>("US_ONLY");
  const [durationLane, setDurationLane] = useState<DurationLaneMode>("short");
  const [hookMode, setHookMode] = useState<HookMode>("all");
  const [fastPublishMode, setFastPublishMode] = useState(true);
  const [strictOriginalityGuard, setStrictOriginalityGuard] = useState(true);
  const [publishFlowSummary, setPublishFlowSummary] = useState<PublishFlowSummary | null>(null);
  const [promotedPublishCopyOverride, setPromotedPublishCopyOverride] =
    useState<PromotedVariantPublishCopyOverride | null>(null);
  const [lastGeneratedRestoreNotice, setLastGeneratedRestoreNotice] =
    useState<string | null>(null);

  const applyBuildSnapshot = useCallback(
    (
      snapshot: BuildWorkflowPresetSnapshot,
      options: { clearGeneratedOutput?: boolean } = {}
    ) => {
      setPredator(snapshot.predator);
      setPrey(snapshot.prey);
      setWildlifeScopeMode(snapshot.wildlifeScopeMode);
      setContentLane(snapshot.contentLane);
      setCameraAnglePreset(snapshot.cameraAnglePreset);
      setArc(snapshot.arc);
      setConceptArcOverride(null);
      setWeather(snapshot.weather);
      setHabitat(snapshot.habitat);
      setDepthMode(snapshot.depthMode);
      setEmotionalTone(snapshot.emotionalTone);
      setAnimalVibe(snapshot.animalVibe);
      setRunwayModel(snapshot.runwayModel);
      setKlingModel(snapshot.klingModel);
      setRealismMode(snapshot.realismMode);
      setMotionOnlyI2V(snapshot.motionOnlyI2V);
      setReferenceLock(snapshot.referenceLock);
      setSingleActionRule(snapshot.singleActionRule);
      setMicroMotion(snapshot.microMotion);
      setHeroVeo(snapshot.heroVeo);
      setAutoApplyHighDrift(snapshot.autoApplyHighDrift);
      setSceneDescription(snapshot.sceneDescription);
      setSceneDescriptionMode(snapshot.sceneDescriptionMode);
      setSceneDescriptionTouched(snapshot.sceneDescriptionTouched);
      setSceneDescriptionVariant(0);
      setActiveProvider(snapshot.activeProvider);
      setDurationLane(snapshot.durationLane);
      setHookMode(snapshot.hookMode);
      setFastPublishMode(snapshot.fastPublishMode);
      setStrictOriginalityGuard(snapshot.strictOriginalityGuard);
      setPromotedPublishCopyOverride(null);
      setLastGeneratedRestoreNotice(null);
      setError("");

      if (options.clearGeneratedOutput !== false) {
        setPkg(null);
        setPublishFlowSummary(null);
      }
    },
    []
  );

  const applyWorkflowPreset = useCallback(
    (preset: { snapshot: BuildWorkflowPresetSnapshot }) => {
      applyBuildSnapshot(preset.snapshot);
    },
    [applyBuildSnapshot]
  );

  const handleApplyWorkflowTestPreset = useCallback(
    (presetId: string) => {
      const preset = WORKFLOW_TEST_PRESETS.find((candidate) => candidate.id === presetId);

      if (!preset) {
        return;
      }

      applyBuildSnapshot(preset.snapshot);
      setStep(1);
      setActiveTab("build");
    },
    [applyBuildSnapshot]
  );

  function handleResetDefaults() {
    setPredator(DEFAULT_PREDATOR);
    setPrey(DEFAULT_PREY);
    setWildlifeScopeMode(DEFAULT_WILDLIFE_SCOPE_MODE);
    setContentLane(DEFAULT_CONTENT_LANE);
    setCameraAnglePreset(DEFAULT_CAMERA_PRESET);
    setArc(DEFAULT_ARC);
    setConceptArcOverride(null);
    setWeather(DEFAULT_WEATHER);
    setHabitat(DEFAULT_HABITAT);
    setDepthMode(DEFAULT_DEPTH_MODE);
    setEmotionalTone(DEFAULT_EMOTIONAL_TONE);
    setAnimalVibe(DEFAULT_ANIMAL_VIBE);
    setPromotedPublishCopyOverride(null);
  }

  useBuildPersistence({
    predator,
    prey,
    arc,
    wildlifeScopeMode,
    contentLane,
    cameraAnglePreset,
    weather,
    depthMode,
    habitat,
    durationLane,
    hookMode,
    fastPublishMode,
    strictOriginalityGuard,
    activeProvider,
    runwayModel,
    klingModel,
    realismMode,
    motionOnlyI2V,
    referenceLock,
    singleActionRule,
    microMotion,
    heroVeo,
    autoApplyHighDrift,
    setPredator,
    setPrey,
    setArc,
    setWildlifeScopeMode,
    setContentLane,
    setCameraAnglePreset,
    setWeather,
    setDepthMode,
    setHabitat,
    setDurationLane,
    setHookMode,
    setFastPublishMode,
    setStrictOriginalityGuard,
    setActiveProvider,
    setRunwayModel,
    setKlingModel,
    setRealismMode,
    setMotionOnlyI2V,
    setReferenceLock,
    setSingleActionRule,
    setMicroMotion,
    setHeroVeo,
    setAutoApplyHighDrift,
  });

  const {
    customPredators,
    customModalOpen,
    customForm,
    predatorOptions,
    setCustomModalOpen,
    setCustomForm,
    openCustomAnimalModal,
    saveCustomAnimal,
    deleteCustomAnimal,
  } = useCustomAnimals({
    currentPredator: predator,
    wildlifeScopeMode,
    defaultPrey: DEFAULT_PREY,
    defaultHabitat: DEFAULT_HABITAT,
    onSelectCustomAnimal: (selection) => {
      setPredator(selection.predator);
      setPrey(selection.prey);
      setArc(selection.arc);
      setHabitat(selection.habitat);
    },
    onResetDefaults: handleResetDefaults,
  });

  useEffect(() => {
    if (!predatorOptions.length || predatorOptions.includes(predator)) return;

    const scopeDefault = getWildlifeScopeDefaultSelection(wildlifeScopeMode);
    const fallbackPredator = predatorOptions.includes(scopeDefault.predator)
      ? scopeDefault.predator
      : predatorOptions.includes(DEFAULT_PREDATOR)
        ? DEFAULT_PREDATOR
        : predatorOptions[0];

    if (fallbackPredator && predator !== fallbackPredator) {
      setPredator(fallbackPredator);
      if (fallbackPredator === scopeDefault.predator && prey !== scopeDefault.prey) {
        setPrey(scopeDefault.prey);
      }
    }
  }, [predator, predatorOptions, prey, wildlifeScopeMode]);

  const {
    preset,
    preyOptions: previewPreyOptions,
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
  } = useBuildPreview({
    predator,
    prey,
    arc,
    arcOverride: conceptArcOverride,
    contentLane,
    habitat,
    weather,
    depthMode,
    customPredators,
    wildlifeScopeMode,
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
  });

  const currentWorkflowPresetSnapshot = useMemo(
    () => ({
      predator,
      prey,
      wildlifeScopeMode,
      contentLane,
      cameraAnglePreset,
      arc: previewArc,
      habitat,
      weather,
      durationLane,
      fastPublishMode,
      strictOriginalityGuard,
      hookMode,
      depthMode,
      emotionalTone,
      animalVibe,
      realismMode,
      motionOnlyI2V,
      referenceLock,
      singleActionRule,
      microMotion,
      heroVeo,
      autoApplyHighDrift,
      runwayModel,
      klingModel,
      activeProvider,
      sceneDescriptionMode,
      sceneDescription,
      sceneDescriptionTouched,
    }),
    [
      activeProvider,
      animalVibe,
      autoApplyHighDrift,
      cameraAnglePreset,
      contentLane,
      depthMode,
      durationLane,
      emotionalTone,
      fastPublishMode,
      habitat,
      heroVeo,
      hookMode,
      klingModel,
      microMotion,
      motionOnlyI2V,
      predator,
      prey,
      previewArc,
      realismMode,
      referenceLock,
      runwayModel,
      sceneDescription,
      sceneDescriptionMode,
      sceneDescriptionTouched,
      singleActionRule,
      strictOriginalityGuard,
      weather,
      wildlifeScopeMode,
    ]
  );

  const currentStoryboardHref = useMemo(() => {
    const params = new URLSearchParams({
      source: "build",
      predator,
      prey,
      habitat,
      weather,
      arc: previewArc,
      contentLane,
      cameraAnglePreset,
      durationLane,
      sceneDescription,
      finalEnvironment,
    });

    return `/storyboard?${params.toString()}`;
  }, [
    cameraAnglePreset,
    contentLane,
    durationLane,
    finalEnvironment,
    habitat,
    predator,
    prey,
    previewArc,
    sceneDescription,
    weather,
  ]);

  const activePromotedPublishCopyOverride = useMemo<ActivePromotedPublishCopyOverride | null>(
    () => {
      if (!promotedPublishCopyOverride) return null;
      if (promotedPublishCopyOverride.predator !== predator) return null;
      if (promotedPublishCopyOverride.prey !== prey) return null;
      if (promotedPublishCopyOverride.contentLane !== contentLane) return null;
      if (promotedPublishCopyOverride.arc !== previewArc) return null;
      if (promotedPublishCopyOverride.habitat !== habitat) return null;
      if (promotedPublishCopyOverride.durationLane !== durationLane) return null;
      if (promotedPublishCopyOverride.fastPublishMode !== fastPublishMode) return null;
      if (promotedPublishCopyOverride.hookFamily !== previewHookFamily) return null;

      return promotedPublishCopyOverride;
    },
    [
      contentLane,
      durationLane,
      fastPublishMode,
      habitat,
      predator,
      prey,
      previewArc,
      previewHookFamily,
      promotedPublishCopyOverride,
    ]
  );

  const workflowPresetControls = useWorkflowPresets({
    currentSnapshot: currentWorkflowPresetSnapshot,
    onLoadPreset: applyWorkflowPreset,
  });

  const lastGeneratedOutputDebouncer = useMemo(
    () => createLastGeneratedOutputDebouncer(writeLastGeneratedOutput),
    []
  );

  useEffect(() => {
    const restoredOutput = readLastGeneratedOutput();
    if (!restoredOutput) return;

    const hasSharedState = hasShareStateInUrl();
    if (
      hasSharedState &&
      !shareStateMatchesWorkflowSnapshot(
        readShareState(),
        restoredOutput.snapshot
      )
    ) {
      return;
    }

    applyBuildSnapshot(restoredOutput.snapshot, { clearGeneratedOutput: false });
    setPkg(restoredOutput.pkg);
    setPublishFlowSummary(restoredOutput.publishFlowSummary);
    setPackageLocks(restoredOutput.packageLocks);
    setStep(3);
    setActiveTab("build");
    setLastGeneratedRestoreNotice(
      "Restored your last generated output from this browser."
    );
  }, [applyBuildSnapshot]);

  useEffect(() => {
    if (!pkg) {
      lastGeneratedOutputDebouncer.cancel();
      return;
    }

    lastGeneratedOutputDebouncer.schedule({
      schema: "wstv.last-generated-output",
      version: 1,
      storedAt: new Date().toISOString(),
      snapshot: currentWorkflowPresetSnapshot,
      pkg,
      publishFlowSummary,
      packageLocks,
    });
  }, [
    currentWorkflowPresetSnapshot,
    lastGeneratedOutputDebouncer,
    packageLocks,
    pkg,
    publishFlowSummary,
  ]);

  useEffect(() => () => {
    lastGeneratedOutputDebouncer.cancel();
  }, [lastGeneratedOutputDebouncer]);

  useEffect(() => {
    setConceptArcOverride(null);
  }, [predator, prey, contentLane]);

  const {
    variants: conceptVariants,
    winners: conceptVariantWinners,
    activeVariantId: activeConceptVariantId,
    promoteVariant: promoteConceptVariant,
    autoCleanupVariant: autoCleanupConceptVariant,
  } = useConceptVariantLab({
    predator,
    prey,
    contentLane,
    currentArc: previewArc,
    currentHabitat: habitat,
    presetEnvironment: preset.environment,
    presetPrey: preset.prey,
    driftRisk: preset.driftRisk,
    weather,
    depthMode,
    durationLane,
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
    currentHookFamily: previewHookFamily,
    setArc,
    setArcOverride: setConceptArcOverride,
    setHabitat,
    setDurationLane,
    setFastPublishMode,
    setHookMode,
    setSceneDescription,
    setSceneDescriptionMode,
    setSceneDescriptionTouched,
    setSceneDescriptionVariant,
    setPromotedPublishCopyOverride,
  });

  function captureCurrentQuality(): QualityState {
    return { realismMode, motionOnlyI2V, referenceLock, singleActionRule, microMotion, heroVeo };
  }
  function applyQualityState(s: QualityState) {
    setRealismMode(s.realismMode); setMotionOnlyI2V(s.motionOnlyI2V);
    setReferenceLock(s.referenceLock); setSingleActionRule(s.singleActionRule);
    setMicroMotion(s.microMotion); setHeroVeo(s.heroVeo);
  }
  function applyRecommendedQuality() {
    setLastQualityBeforeApply(captureCurrentQuality());
    const r = qualityReco.recommended;
    if (r.realismMode) setRealismMode(r.realismMode);
    if (r.durationLane) setDurationLane(r.durationLane);
    if (typeof r.motionOnlyI2V === "boolean") setMotionOnlyI2V(r.motionOnlyI2V);
    if (typeof r.referenceLock === "boolean") setReferenceLock(r.referenceLock);
    if (typeof r.singleActionRule === "boolean") setSingleActionRule(r.singleActionRule);
    if (typeof r.microMotion === "boolean") setMicroMotion(r.microMotion);
    if (typeof r.heroVeo === "boolean") setHeroVeo(r.heroVeo);
  }
  function undoRecommendedQuality() {
    if (!lastQualityBeforeApply) return;
    applyQualityState(lastQualityBeforeApply);
    setLastQualityBeforeApply(null);
  }

  const lastAutoAppliedKeyRef = useRef<string>("");
  useEffect(() => {
    if (!autoApplyHighDrift) return;
    if (qualityReco.level !== "HIGH") return;
    const key = [predator, prey, String(arc), preset.driftRisk, runwayModel, klingModel].join("|");
    if (lastAutoAppliedKeyRef.current === key) return;
    lastAutoAppliedKeyRef.current = key;
    applyRecommendedQuality();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoApplyHighDrift, qualityReco.level, predator, prey, arc, preset.driftRisk, runwayModel, klingModel]);

  const {
    handleGenerate,
    handleRegenerateUnlockedSections,
    handleRestoreVersion,
    handleTogglePackageLock,
  } = useBuildGenerationActions({
    predator,
    prey,
    arc,
    previewArc,
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
    finalEnvironment,
    preset,
    sceneDescription,
    mediaAnalysis,
    activeProvider,
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
    onGenerated: () => {
      setLastGeneratedRestoreNotice(null);
      setStep(3);
    },
  });

  const qualityPanelProps = {
    realismMode,
    setRealismMode,
    motionOnlyI2V,
    setMotionOnlyI2V,
    referenceLock,
    setReferenceLock,
    singleActionRule,
    setSingleActionRule,
    microMotion,
    setMicroMotion,
    heroVeo,
    setHeroVeo,
  };

  const storyboardHref = useMemo(() => {
    const params = new URLSearchParams({
      source: "build",
      predator,
      prey,
      wildlifeScopeMode,
      contentLane,
      cameraAnglePreset,
      arc: previewArc,
      habitat,
      weather,
      durationLane,
      sceneDescription,
      sceneDescriptionMode,
      sceneDescriptionTouched: String(sceneDescriptionTouched),
    });

    return "/storyboard?" + params.toString();
  }, [
    predator,
    prey,
    wildlifeScopeMode,
    contentLane,
    cameraAnglePreset,
    previewArc,
    habitat,
    weather,
    durationLane,
    sceneDescription,
    sceneDescriptionMode,
    sceneDescriptionTouched,
  ]);

  const compactStoryboardLinkMetadata = useMemo(
    () =>
      buildStoryboardPreviewLinkMetadata({
        predator,
        prey,
      }),
    [predator, prey]
  );

  const detailedStoryboardLinkMetadata = useMemo(
    () =>
      buildStoryboardPreviewLinkMetadata({
        predator,
        prey,
        finalEnvironment,
      }),
    [finalEnvironment, predator, prey]
  );
  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <main className="ui-theme-scope min-h-screen w-full bg-[color:var(--bg)] text-[color:var(--text)]">

      {/* ── APP HEADER — dark cinematic anchor ─────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-gray-950/95 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[var(--main-max-width)] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 sm:min-h-[56px] sm:flex-nowrap">

            {/* Brand */}
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/[0.12]">
                <span className="text-[11px] font-bold text-white">W</span>
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="truncate text-sm font-bold tracking-tight text-white sm:text-[15px]">WILD STORIES TV</span>
                  <span className="hidden text-[10px] font-medium text-white/35 sm:inline">WSTV Production Studio</span>
                </div>
                <div className="mt-0.5 text-[10px] font-medium text-white/30 sm:hidden">Production Studio</div>
              </div>
            </div>

            {/* Top-level tab switcher — compact segmented control */}
            <div className="order-3 flex w-full justify-start sm:order-2 sm:flex-1 sm:justify-center">
              <nav className="inline-flex items-center rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                {([
                  { id: "build" as TopTab, label: "Build", icon: "⚡" },
                  { id: "workflows" as TopTab, label: "Workflows", icon: "⬡" },
                ]).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`group flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold tracking-[0.01em] transition-all ${
                      activeTab === tab.id
                        ? "border-white/15 bg-white text-gray-950 shadow-sm"
                        : "border-transparent text-white/50 hover:bg-white/[0.06] hover:text-white/80"
                    }`}
                  >
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full text-[11px] transition-all ${
                        activeTab === tab.id
                          ? "bg-gray-900/10 text-gray-900"
                          : "bg-white/[0.06] text-white/70 group-hover:bg-white/[0.1] group-hover:text-white"
                      }`}
                    >
                      {tab.icon}
                    </span>
                    {tab.label}
                  </button>
                ))}
                <Link
                  href="/image"
                  className="group flex items-center gap-2 rounded-xl border border-transparent px-3.5 py-2 text-xs font-semibold tracking-[0.01em] text-white/50 transition-all hover:bg-white/[0.06] hover:text-white/80"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-white/[0.06] text-[11px] text-white/70 transition-all group-hover:bg-white/[0.1] group-hover:text-white">
                    ▧
                  </span>
                  Image
                </Link>
                <Link
                  href="/storyboard"
                  className="group flex items-center gap-2 rounded-xl border border-transparent px-3.5 py-2 text-xs font-semibold tracking-[0.01em] text-white/50 transition-all hover:bg-white/[0.06] hover:text-white/80"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-white/[0.06] text-[11px] text-white/70 transition-all group-hover:bg-white/[0.1] group-hover:text-white">
                    ▣
                  </span>
                  Storyboard
                </Link>
              </nav>
            </div>

            <div className="shrink-0 sm:order-3">
              <SettingsDrawer />
            </div>
          </div>

          {activeTab === "build" && (
            <div className="border-t border-white/[0.06] pb-3 pt-2">
              <div className="overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] shadow-[var(--surface-shadow)] backdrop-blur-xl">
                <nav
                  aria-label="Build steps"
                  className="flex flex-wrap items-center gap-2 px-2 py-2.5 sm:flex-nowrap sm:px-3"
                >
                  {([
                    { step: 1 as Step, label: "Wildlife Setup" },
                    { step: 2 as Step, label: "Engine & Quality" },
                    { step: 3 as Step, label: "Generate" },
                  ]).map((s, i) => (
                    <div key={s.step} className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        aria-current={step === s.step ? "step" : undefined}
                        onClick={() => setStep(s.step)}
                        className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-left text-xs font-semibold transition-all active:scale-[0.98] ${
                          step === s.step
                            ? "border-gray-900 bg-gray-900 text-white shadow-sm"
                            : step > s.step
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "border-transparent bg-transparent text-[color:var(--muted)] hover:border-[color:var(--border)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text)]"
                        }`}
                      >
                        <span
                          className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
                            step === s.step
                              ? "bg-white/15 text-white"
                              : step > s.step
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-[color:var(--surface-muted)] text-[color:var(--muted)]"
                          }`}
                        >
                          {step > s.step ? "✓" : s.step}
                        </span>
                        <span className="flex flex-col items-start leading-none">
                          <span className={`text-[9px] uppercase tracking-[0.14em] ${
                            step === s.step ? "text-white/55" : step > s.step ? "text-emerald-500" : "text-gray-400"
                          }`}>
                            Step {s.step}
                          </span>
                          <span>{s.label}</span>
                        </span>
                      </button>
                      {i < 2 && (
                        <span className="hidden shrink-0 rounded-full bg-[color:var(--surface-muted)] px-2 py-1 text-[10px] font-semibold text-[color:var(--muted)] sm:inline-flex">
                          ›
                        </span>
                      )}
                    </div>
                  ))}
                </nav>
                <div className="border-t border-[color:var(--border)] px-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs leading-5 text-[color:var(--muted)]">
                      Open a read-only storyboard preview generated from the current Build setup.
                    </p>
                    <Link
                      key={compactStoryboardLinkMetadata.key}
                      href={storyboardHref}
                      aria-label={compactStoryboardLinkMetadata.ariaLabel}
                      title={compactStoryboardLinkMetadata.title}
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/15"
                    >
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-cyan-400/15 text-[11px] text-cyan-200">
                        ▣
                      </span>
                      Open Storyboard for Current Setup
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          BUILD TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "build" && (
        <>
          {/* Page content */}
          <div className="mx-auto w-full max-w-[var(--main-max-width)] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
            <div className="mb-5 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4 shadow-[var(--surface-shadow)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400/80">
                    Storyboard preview
                  </p>
                  <h2 className="mt-2 text-lg font-semibold text-[color:var(--text)]">
                    Open Storyboard for Current Setup
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
                    Storyboard will generate Nano Banana 2 master image prompts and GPT Image 2 backup prompts for the current animal setup.
                  </p>
                </div>
                <Link
                  key={detailedStoryboardLinkMetadata.key}
                  href={currentStoryboardHref}
                  aria-label={detailedStoryboardLinkMetadata.ariaLabel}
                  title={detailedStoryboardLinkMetadata.title}
                  className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-2 text-sm font-semibold text-[color:var(--text)] transition hover:border-cyan-400/60 hover:text-cyan-200"
                >
                  Open Storyboard for Current Setup
                </Link>
              </div>
            </div>

            {step === 1 && (
              <Step1Setup
                predator={predator}
                prey={prey}
                wildlifeScopeMode={wildlifeScopeMode}
                contentLane={contentLane}
                cameraAnglePreset={cameraAnglePreset}
                arc={arc}
                weather={weather}
                depthMode={depthMode}
                habitat={habitat}
                emotionalTone={emotionalTone}
                animalVibe={animalVibe}
                predatorOptions={predatorOptions}
                preyOptions={previewPreyOptions}
                customPredatorCount={customPredators.length}
                finalEnvironment={finalEnvironment}
                driftRisk={preset.driftRisk}
                workflowPresets={workflowPresetControls.presets}
                workflowPresetPacks={workflowPresetControls.presetPacks}
                workflowPresetLibraries={workflowPresetControls.availableLibraries}
                activeWorkflowPresetLibrary={workflowPresetControls.activeLibrary}
                workflowPresetAuthSession={workflowPresetControls.authSession}
                activeWorkflowPresetId={workflowPresetControls.activePresetId}
                activeWorkflowPresetPackId={workflowPresetControls.activePresetPackId}
                defaultWorkflowPresetId={workflowPresetControls.defaultPresetId}
                workflowPresetName={workflowPresetControls.presetName}
                workflowPresetPackName={workflowPresetControls.packName}
                workflowPresetPackDescription={workflowPresetControls.packDescription}
                workflowPresetPackTagsText={workflowPresetControls.packTagsText}
                workflowPresetAuthEmailInput={
                  workflowPresetControls.authEmailInput
                }
                workflowPresetAuthPasswordInput={
                  workflowPresetControls.authPasswordInput
                }
                workflowPresetAuthDisplayNameInput={
                  workflowPresetControls.authDisplayNameInput
                }
                workflowPresetSharedLibraryNameInput={
                  workflowPresetControls.sharedLibraryNameInput
                }
                workflowPresetSharedLibraryDescriptionInput={
                  workflowPresetControls.sharedLibraryDescriptionInput
                }
                workflowPresetSharedMemberEmailInput={
                  workflowPresetControls.sharedMemberEmailInput
                }
                workflowPresetSharedMemberRole={
                  workflowPresetControls.sharedMemberRole
                }
                workflowPresetCloudSyncState={
                  workflowPresetControls.cloudSyncStatus.state
                }
                workflowPresetCloudSyncMessage={
                  workflowPresetControls.cloudSyncStatus.message
                }
                workflowPresetCloudSyncLastSyncedAt={
                  workflowPresetControls.cloudSyncStatus.lastSyncedAt
                }
                suggestedWorkflowPresetName={workflowPresetControls.suggestedPresetName}
                workflowPresetStatus={workflowPresetControls.presetStatus}
                activeWorkflowPresetIsDirty={workflowPresetControls.activePresetIsDirty}
                canEditWorkflowPresetLibrary={
                  workflowPresetControls.canEditActiveLibrary
                }
                canManageWorkflowPresetLibrary={
                  workflowPresetControls.canManageActiveLibrary
                }
                onPredatorChange={setPredator}
                onPreyChange={setPrey}
                onWildlifeScopeModeChange={setWildlifeScopeMode}
                onContentLaneChange={setContentLane}
                onCameraAnglePresetChange={setCameraAnglePreset}
                onWeatherChange={setWeather}
                onDepthModeChange={setDepthMode}
                onHabitatChange={setHabitat}
                onEmotionalToneChange={setEmotionalTone}
                onAnimalVibeChange={setAnimalVibe}
                onApplyWorkflowTestPreset={handleApplyWorkflowTestPreset}
                onResetDefaults={handleResetDefaults}
                onContinue={() => setStep(2)}
                onWorkflowPresetNameChange={workflowPresetControls.setPresetName}
                onWorkflowPresetPackNameChange={workflowPresetControls.setPackName}
                onWorkflowPresetPackDescriptionChange={
                  workflowPresetControls.setPackDescription
                }
                onWorkflowPresetPackTagsTextChange={
                  workflowPresetControls.setPackTagsText
                }
                onWorkflowPresetAuthEmailInputChange={
                  workflowPresetControls.setAuthEmailInput
                }
                onWorkflowPresetAuthPasswordInputChange={
                  workflowPresetControls.setAuthPasswordInput
                }
                onWorkflowPresetAuthDisplayNameInputChange={
                  workflowPresetControls.setAuthDisplayNameInput
                }
                onWorkflowPresetSharedLibraryNameInputChange={
                  workflowPresetControls.setSharedLibraryNameInput
                }
                onWorkflowPresetSharedLibraryDescriptionInputChange={
                  workflowPresetControls.setSharedLibraryDescriptionInput
                }
                onWorkflowPresetSharedMemberEmailInputChange={
                  workflowPresetControls.setSharedMemberEmailInput
                }
                onWorkflowPresetSharedMemberRoleChange={
                  workflowPresetControls.setSharedMemberRole
                }
                onSelectedWorkflowPresetLibraryChange={
                  workflowPresetControls.setSelectedLibraryId
                }
                onSaveWorkflowPreset={workflowPresetControls.saveCurrentAsPreset}
                onUpdateWorkflowPreset={workflowPresetControls.updatePresetFromCurrent}
                onLoadWorkflowPreset={workflowPresetControls.loadPreset}
                onDeleteWorkflowPreset={workflowPresetControls.deletePreset}
                onSetDefaultWorkflowPreset={workflowPresetControls.setPresetAsDefault}
                onClearDefaultWorkflowPreset={workflowPresetControls.clearDefaultPreset}
                onExportWorkflowPreset={workflowPresetControls.exportPreset}
                onExportAllWorkflowPresets={workflowPresetControls.exportAllPresets}
                onImportWorkflowPresets={workflowPresetControls.importPresetsFromJson}
                onCreateWorkflowPresetPack={
                  workflowPresetControls.createPresetPackFromSelection
                }
                onDeleteWorkflowPresetPack={workflowPresetControls.deletePresetPack}
                onExportWorkflowPresetPack={workflowPresetControls.exportPresetPack}
                onImportWorkflowPresetPack={
                  workflowPresetControls.importPresetPackFromJson
                }
                onApplyWorkflowPresetPack={workflowPresetControls.applyPresetPack}
                onSignInWorkflowPresetLibrary={() => {
                  void workflowPresetControls.signIn();
                }}
                onSignUpWorkflowPresetLibrary={() => {
                  void workflowPresetControls.signUp();
                }}
                onSignOutWorkflowPresetLibrary={() => {
                  void workflowPresetControls.signOut();
                }}
                onSyncWorkflowPresetLibrary={() => {
                  void workflowPresetControls.syncActiveLibrary();
                }}
                onCreateSharedWorkflowPresetLibrary={() => {
                  void workflowPresetControls.createSharedLibrary();
                }}
                onSaveSharedWorkflowPresetLibraryMember={() => {
                  void workflowPresetControls.saveSharedLibraryMember();
                }}
                onRemoveSharedWorkflowPresetLibraryMember={(userId) => {
                  void workflowPresetControls.removeSharedLibraryMember(userId);
                }}
                workflowPresetImportStatus={workflowPresetControls.importStatus}
                workflowPresetPackStatus={workflowPresetControls.packStatus}
                onOpenCustomAnimal={() =>
                  openCustomAnimalModal({
                    defaultArc: arc,
                    driftRisk: preset.driftRisk,
                  })
                }
              />
            )}

            {step === 2 && (
              <Step2EngineQuality
                qualityReco={qualityReco}
                autoApplyHighDrift={autoApplyHighDrift}
                hasUndoQuality={Boolean(lastQualityBeforeApply)}
                onToggleAutoApplyHighDrift={() =>
                  setAutoApplyHighDrift((value) => !value)
                }
                onUndoRecommendedQuality={undoRecommendedQuality}
                onApplyRecommendedQuality={applyRecommendedQuality}
                marketMode={marketMode}
                durationLane={durationLane}
                hookMode={hookMode}
                fastPublishMode={fastPublishMode}
                strictOriginalityGuard={strictOriginalityGuard}
                previewAudienceScore={previewAudienceScore}
                previewOpeningFrameScore={previewOpeningFrameScore}
                previewPublishGuardReport={previewPublishGuardReport}
                runwayModel={runwayModel}
                klingModel={klingModel}
                onRunwayModelChange={setRunwayModel}
                onKlingModelChange={setKlingModel}
                qualityPanelProps={qualityPanelProps}
                activeProvider={activeProvider}
                mediaAnalysis={mediaAnalysis}
                onMediaAnalysisComplete={setMediaAnalysis}
                onClearMediaAnalysis={() => setMediaAnalysis(null)}
                sceneDescription={sceneDescription}
                sceneDescriptionMode={sceneDescriptionMode}
                sceneDescriptionTouched={sceneDescriptionTouched}
                sceneMode={sceneMode}
                onSceneModeChange={setSceneMode}
                onAutoFillSceneDescription={() => applyAutoSceneDescription(0)}
                onRegenerateSceneDescription={handleSceneDescriptionRegenerate}
                onSceneDescriptionChange={handleSceneDescriptionChange}
                predator={predator}
                prey={prey}
                arc={previewArc}
                habitat={habitat}
                weather={weather}
                finalEnvironment={finalEnvironment}
                contentLane={contentLane}
                driftRisk={preset.driftRisk}
                onDurationLaneChange={setDurationLane}
                onHookModeChange={setHookMode}
                onToggleFastPublishMode={() => setFastPublishMode((value) => !value)}
                onToggleStrictOriginalityGuard={() =>
                  setStrictOriginalityGuard((value) => !value)
                }
                onBack={() => setStep(1)}
                onContinue={() => setStep(3)}
              />
            )}

            {step === 3 && (
              <Step3Generate
                predator={predator}
                prey={prey}
                contentLane={contentLane}
                activeProvider={activeProvider}
                arc={arc}
                habitat={habitat}
                weather={weather}
                depthMode={depthMode}
                cameraAnglePreset={cameraAnglePreset}
                emotionalTone={emotionalTone}
                animalVibe={animalVibe}
                finalEnvironment={finalEnvironment}
                sceneDescription={sceneDescription}
                onActiveProviderChange={setActiveProvider}
                onGenerate={handleGenerate}
                onRegenerateUnlocked={handleRegenerateUnlockedSections}
                isGenerating={isGenerating}
                isRegeneratingUnlocked={isRegeneratingUnlocked}
                error={error}
                enhancementNotice={enhancementNotice}
                pkg={pkg}
                packageLocks={packageLocks}
                onTogglePackageLock={handleTogglePackageLock}
                onSetPackageLocks={setPackageLocks}
                publishFlowSummary={publishFlowSummary}
                conceptVariants={conceptVariants}
                conceptVariantWinners={conceptVariantWinners}
                activeConceptVariantId={activeConceptVariantId}
                onPromoteConceptVariant={promoteConceptVariant}
                onAutoCleanupConceptVariant={autoCleanupConceptVariant}
                onRestoreVersion={handleRestoreVersion}
                lastGeneratedRestoreNotice={lastGeneratedRestoreNotice}
                onDismissLastGeneratedRestoreNotice={() =>
                  setLastGeneratedRestoreNotice(null)
                }
                onBack={() => setStep(2)}
              />
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          WORKFLOWS TAB — scoped dark zone
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "workflows" && (
        <div className="min-h-[calc(100vh-56px)] bg-gray-950">
          <div className="w-full px-4 py-8 sm:px-6 sm:py-10 lg:px-8 xl:px-10 2xl:px-12">

            {/* Workflow tab selector */}
            <div className="mb-7 space-y-3">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-2xl">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/30">Workflow Viewer</div>
                  <div className="mt-1 text-sm text-white/50">Switch between the primary hybrid 4-shot production workflow view and the optional Runway-native reference handoff view.</div>
                </div>
                <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      {
                        id: "wstv" as WorkflowTab,
                        label: "WSTV Custom Workflow",
                        badge: "Primary",
                        icon: "◈",
                        description: "Production continuity map",
                      },
                      {
                        id: "runway" as WorkflowTab,
                        label: "Runway Official Workflow",
                        badge: "Optional reference",
                        icon: "↗",
                        description: "Native safe-handoff reference",
                      },
                    ]).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setWorkflowTab(tab.id)}
                        className={`group flex min-w-[240px] items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                          workflowTab === tab.id
                            ? "border-white/15 bg-white/[0.96] text-gray-900 shadow-[0_1px_3px_rgba(15,23,42,0.2)]"
                            : "border-transparent text-white/45 hover:border-white/[0.08] hover:bg-white/[0.04] hover:text-white/75"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`grid h-8 w-8 place-items-center rounded-2xl text-sm ${
                              workflowTab === tab.id
                                ? "bg-gray-900/10 text-gray-900"
                                : "bg-white/[0.06] text-white/70 group-hover:bg-white/[0.1] group-hover:text-white"
                            }`}
                          >
                            {tab.icon}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">{tab.label}</span>
                            <span className={`mt-0.5 block text-[11px] ${
                              workflowTab === tab.id ? "text-gray-500" : "text-white/35 group-hover:text-white/45"
                            }`}>
                              {tab.description}
                            </span>
                          </span>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                          workflowTab === tab.id
                            ? tab.id === "wstv" ? "bg-violet-100 text-violet-700" : "bg-green-100 text-green-700"
                            : "bg-white/[0.06] text-white/35"
                        }`}>
                          {tab.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-xs text-white/25">
                Interactive viewer with drag, zoom, and inspectable continuity wires. The primary runtime lane is the hybrid 4-shot workflow.
              </div>
            </div>

            {/* Diagram frame */}
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gray-900">
              <div className="border-b border-white/[0.08] px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-red-500/60" />
                    <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
                    <div className="h-2 w-2 rounded-full bg-green-500/60" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-300">
                      {workflowTab === "wstv"
                        ? "WSTV · 4-shot production workflow · hybrid primary lane"
                        : "Runway Official · 4-shot safe handoff · Gen-4.5 native"}
                    </div>
                    <div className="mt-0.5 text-[11px] text-gray-500">
                      {workflowTab === "wstv"
                        ? "Production-oriented continuity viewer for the hybrid 4-shot path, with Canonical Anchor, preferred Extract Frame handoff, and Last Frame fallback."
                        : "Optional reference viewer for the Runway-native safe-handoff pattern, manual overrides, and stitched final assembly."}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-3 sm:p-4 lg:p-5">
                {workflowTab === "wstv" ? <WSTVWorkflowDiagram /> : <RunwayOfficialWorkflowDiagram />}
              </div>
            </div>
          </div>
        </div>
      )}

      <CustomAnimalModal
        open={customModalOpen}
        form={customForm}
        onClose={() => setCustomModalOpen(false)}
        onNameChange={(value) =>
          setCustomForm((prev) => ({ ...prev, name: value }))
        }
        onPreyChange={(value) =>
          setCustomForm((prev) => ({ ...prev, prey: value }))
        }
        onEnvironmentChange={(value) =>
          setCustomForm((prev) => ({ ...prev, environment: value }))
        }
        onDefaultArcChange={(value) =>
          setCustomForm((prev) => ({ ...prev, defaultArc: value }))
        }
        onDriftRiskChange={(value) =>
          setCustomForm((prev) => ({ ...prev, driftRisk: value }))
        }
        onSave={saveCustomAnimal}
        onDelete={deleteCustomAnimal}
      />
    </main>
  );
}
