"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import {
  EncounterMode,
  EndingMode,
  HabitatRegion,
  StoryMode,
  ViralLane,
  ViolenceLevel,
} from "@/types";

import type {
  AIProvider,
  ActionStylePreset,
  Arc,
  CameraAnglePreset,
  DepthMode,
  ContentLane,
  EmotionalTone,
  AnimalVibe,
  Weather,
  WeatherHazard,
  RealismMode,
  BuildWorkflowPresetSnapshot,
  GeneratedPackage,
  MediaAnalysisResult,
  PackageLockState,
  RunwayModel,
  KlingModel,
  EscapeDirection,
  OffspringLabel,
  Season,
  StrikeMethod,
  TimeOfDay,
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
import {
  formatStoryModeGenerateCtaLabel,
  formatStoryModeSubjectPair,
} from "@/lib/story-mode-prompt-context";
import type { StoryModePreset } from "@/lib/story-mode-presets";
import {
  appendCreatorQaRun,
  buildCreatorQaRun,
  buildPinnedGeneratedOutput,
  type CreatorQaRun,
  type PinnedGeneratedOutput,
} from "@/lib/creator-qa-run-history";
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
import {
  getStoryModeSubjectDefaults,
  type StoryModeSubjectValues,
} from "@/components/build/story-mode-subject-fields";
import Step2EngineQuality from "@/components/build/step-2-engine-quality";
import Step3Generate from "@/components/build/step-3-generate";

type Step = 1 | 2 | 3;
type TopTab = "build" | "workflows";

const STORYBOARD_HANDOFF_KEY = "wstv-storyboard-handoff";
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
const DEFAULT_ACTION_STYLE: ActionStylePreset = "Natural tension";
const DEFAULT_CAMERA_PRESET: CameraAnglePreset = DEFAULT_CAMERA_ANGLE_PRESET;
const DEFAULT_ARC: Arc = "Ambush attack";
const DEFAULT_WEATHER: Weather = "Golden Hour";
const DEFAULT_HABITAT: HabitatPreset = "Auto";
const DEFAULT_DEPTH_MODE: DepthMode = "Balanced Depth";
const DEFAULT_EMOTIONAL_TONE: EmotionalTone = "Raw Tension";
const DEFAULT_ANIMAL_VIBE: AnimalVibe = "National Geographic Wild";
const DEFAULT_STORY_MODE = StoryMode.PREDATOR_VS_PREY;
const DEFAULT_ENCOUNTER_MODE = EncounterMode.PEAK_TENSION;
const DEFAULT_ENDING_MODE = EndingMode.ESCAPE;
const DEFAULT_VIRAL_LANE = ViralLane.TENSION;
const DEFAULT_VIOLENCE_LEVEL = ViolenceLevel.DISPLAY_ONLY;
const DEFAULT_HABITAT_REGION = HabitatRegion.YELLOWSTONE;
const DEFAULT_SEASON: Season = "FALL";
const DEFAULT_TIME_OF_DAY: TimeOfDay = "GOLDEN_HOUR";
const DEFAULT_OFFSPRING_LABEL: OffspringLabel = "cub";
const DEFAULT_STRIKE_METHOD: StrikeMethod = "AMBUSH";
const DEFAULT_ESCAPE_DIRECTION: EscapeDirection = "BRUSH";
const DEFAULT_WEATHER_HAZARD: WeatherHazard = "BLIZZARD";

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function Page() {
  // STEP 1
  const [predator, setPredator] = useState(DEFAULT_PREDATOR);
  const [prey, setPrey] = useState(DEFAULT_PREY);
  const [wildlifeScopeMode, setWildlifeScopeMode] = useState<WildlifeScopeMode>(
    DEFAULT_WILDLIFE_SCOPE_MODE
  );
  const [contentLane, setContentLane] = useState<ContentLane>(DEFAULT_CONTENT_LANE);
  const [actionStyle, setActionStyle] = useState<ActionStylePreset>(DEFAULT_ACTION_STYLE);
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
  const [storyMode, setStoryMode] = useState(DEFAULT_STORY_MODE);
  const [encounterMode, setEncounterMode] = useState(DEFAULT_ENCOUNTER_MODE);
  const [endingMode, setEndingMode] = useState(DEFAULT_ENDING_MODE);
  const [viralLane, setViralLane] = useState(DEFAULT_VIRAL_LANE);
  const [violenceLevel, setViolenceLevel] = useState(DEFAULT_VIOLENCE_LEVEL);
  const [habitatRegion, setHabitatRegion] = useState(DEFAULT_HABITAT_REGION);
  const [season, setSeason] = useState<Season>(DEFAULT_SEASON);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(DEFAULT_TIME_OF_DAY);
  const [subjectA, setSubjectA] = useState<string | undefined>();
  const [subjectB, setSubjectB] = useState<string | undefined>();
  const [groupCount, setGroupCount] = useState<number | undefined>();
  const [offspringLabel, setOffspringLabel] = useState<OffspringLabel>(DEFAULT_OFFSPRING_LABEL);
  const [strikeMethod, setStrikeMethod] = useState<StrikeMethod>(DEFAULT_STRIKE_METHOD);
  const [escapeDirection, setEscapeDirection] = useState<EscapeDirection>(DEFAULT_ESCAPE_DIRECTION);
  const [weatherHazard, setWeatherHazard] = useState<WeatherHazard>(DEFAULT_WEATHER_HAZARD);
  const [rutSeason, setRutSeason] = useState(false);
  const [foodItem, setFoodItem] = useState<string | undefined>();

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
  const [activeProvider, setActiveProvider] = useState<AIProvider>("gemini");
  const [autoFallback, setAutoFallback] = useState(false);
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
  const [creatorQaRuns, setCreatorQaRuns] = useState<CreatorQaRun[]>([]);
  const [pinnedOutput, setPinnedOutput] = useState<PinnedGeneratedOutput | null>(null);
  const [shouldRecordCreatorQaRun, setShouldRecordCreatorQaRun] = useState(false);
  const lastRecordedCreatorQaRunIdRef = useRef("");

  const applyBuildSnapshot = useCallback(
    (
      snapshot: BuildWorkflowPresetSnapshot,
      options: { clearGeneratedOutput?: boolean } = {}
    ) => {
      setPredator(snapshot.predator);
      setPrey(snapshot.prey);
      setWildlifeScopeMode(snapshot.wildlifeScopeMode);
      setContentLane(snapshot.contentLane);
      setActionStyle(snapshot.actionStyle ?? DEFAULT_ACTION_STYLE);
      setCameraAnglePreset(snapshot.cameraAnglePreset);
      setArc(snapshot.arc);
      setConceptArcOverride(null);
      setWeather(snapshot.weather);
      setHabitat(snapshot.habitat);
      setDepthMode(snapshot.depthMode);
      setEmotionalTone(snapshot.emotionalTone);
      setAnimalVibe(snapshot.animalVibe);
      setStoryMode(snapshot.storyMode ?? DEFAULT_STORY_MODE);
      setEncounterMode(snapshot.encounterMode ?? DEFAULT_ENCOUNTER_MODE);
      setEndingMode(snapshot.endingMode ?? DEFAULT_ENDING_MODE);
      setViralLane(snapshot.viralLane ?? DEFAULT_VIRAL_LANE);
      setViolenceLevel(snapshot.violenceLevel ?? DEFAULT_VIOLENCE_LEVEL);
      setHabitatRegion(snapshot.habitatRegion ?? DEFAULT_HABITAT_REGION);
      setSeason(snapshot.season ?? DEFAULT_SEASON);
      setTimeOfDay(snapshot.timeOfDay ?? DEFAULT_TIME_OF_DAY);
      setSubjectA(snapshot.subjectA);
      setSubjectB(snapshot.subjectB);
      setGroupCount(snapshot.groupCount);
      setOffspringLabel(snapshot.offspringLabel ?? DEFAULT_OFFSPRING_LABEL);
      setStrikeMethod(snapshot.strikeMethod ?? DEFAULT_STRIKE_METHOD);
      setEscapeDirection(snapshot.escapeDirection ?? DEFAULT_ESCAPE_DIRECTION);
      setWeatherHazard(snapshot.weatherHazard ?? DEFAULT_WEATHER_HAZARD);
      setRutSeason(snapshot.rutSeason ?? false);
      setFoodItem(snapshot.foodItem);
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
      setShouldRecordCreatorQaRun(false);
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
    setActionStyle(DEFAULT_ACTION_STYLE);
    setCameraAnglePreset(DEFAULT_CAMERA_PRESET);
    setArc(DEFAULT_ARC);
    setConceptArcOverride(null);
    setWeather(DEFAULT_WEATHER);
    setHabitat(DEFAULT_HABITAT);
    setDepthMode(DEFAULT_DEPTH_MODE);
    setEmotionalTone(DEFAULT_EMOTIONAL_TONE);
    setAnimalVibe(DEFAULT_ANIMAL_VIBE);
    setStoryMode(DEFAULT_STORY_MODE);
    setEncounterMode(DEFAULT_ENCOUNTER_MODE);
    setEndingMode(DEFAULT_ENDING_MODE);
    setViralLane(DEFAULT_VIRAL_LANE);
    setViolenceLevel(DEFAULT_VIOLENCE_LEVEL);
    setHabitatRegion(DEFAULT_HABITAT_REGION);
    setSeason(DEFAULT_SEASON);
    setTimeOfDay(DEFAULT_TIME_OF_DAY);
    setSubjectA(undefined);
    setSubjectB(undefined);
    setGroupCount(undefined);
    setOffspringLabel(DEFAULT_OFFSPRING_LABEL);
    setStrikeMethod(DEFAULT_STRIKE_METHOD);
    setEscapeDirection(DEFAULT_ESCAPE_DIRECTION);
    setWeatherHazard(DEFAULT_WEATHER_HAZARD);
    setRutSeason(false);
    setFoodItem(undefined);
    setPromotedPublishCopyOverride(null);
  }

  const handleStoryModeChange = useCallback(
    (value: StoryMode) => {
      const defaults = getStoryModeSubjectDefaults(value, predator, prey);
      setStoryMode(value);
      setSubjectA(defaults.subjectA);
      setSubjectB(defaults.subjectB);
      setGroupCount(defaults.groupCount);
      setOffspringLabel(defaults.offspringLabel ?? DEFAULT_OFFSPRING_LABEL);
      setStrikeMethod(defaults.strikeMethod ?? DEFAULT_STRIKE_METHOD);
      setEscapeDirection(defaults.escapeDirection ?? DEFAULT_ESCAPE_DIRECTION);
      setWeatherHazard(defaults.weatherHazard ?? DEFAULT_WEATHER_HAZARD);
      setRutSeason(defaults.rutSeason ?? false);
      setFoodItem(defaults.foodItem);
    },
    [predator, prey]
  );

  const handleApplyStoryModePreset = useCallback((preset: StoryModePreset) => {
    setStoryMode(preset.storyMode);
    setEncounterMode(preset.encounterMode);
    setEndingMode(preset.endingMode);
    setViralLane(preset.viralLane);
    setViolenceLevel(preset.violenceLevel);
    setHabitatRegion(preset.habitatRegion);
    setSeason(preset.season);
    setTimeOfDay(preset.timeOfDay);
    setSubjectA(preset.subjectA);
    setSubjectB(preset.subjectB);
    setGroupCount(preset.groupCount);
    setOffspringLabel(preset.offspringLabel ?? DEFAULT_OFFSPRING_LABEL);
    setStrikeMethod(preset.strikeMethod ?? DEFAULT_STRIKE_METHOD);
    setEscapeDirection(preset.escapeDirection ?? DEFAULT_ESCAPE_DIRECTION);
    setWeatherHazard(preset.weatherHazard ?? DEFAULT_WEATHER_HAZARD);
    setRutSeason(preset.rutSeason ?? false);
    setFoodItem(preset.foodItem);
    setSceneDescription(preset.sceneDescription);
    setSceneDescriptionMode("manual");
    setSceneDescriptionTouched(true);
    setSceneDescriptionVariant((current) => current + 1);
    setPromotedPublishCopyOverride(null);
  }, []);

  useBuildPersistence({
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
    setStoryMode,
    setEncounterMode,
    setEndingMode,
    setViralLane,
    setViolenceLevel,
    setHabitatRegion,
    setSeason,
    setTimeOfDay,
    setSubjectA,
    setSubjectB,
    setGroupCount,
    setOffspringLabel,
    setStrikeMethod,
    setEscapeDirection,
    setWeatherHazard,
    setRutSeason,
    setFoodItem,
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

  const currentStorySubjectSnapshot = useMemo<StoryModeSubjectValues>(() => {
    const defaults = getStoryModeSubjectDefaults(storyMode, predator, prey);
    const resolvedSubjectA =
      storyMode === StoryMode.PREDATOR_VS_PREY
        ? predator
        : subjectA?.trim() || defaults.subjectA;
    const resolvedSubjectB =
      storyMode === StoryMode.PREDATOR_VS_PREY
        ? prey
        : subjectB?.trim() || defaults.subjectB;

    return {
      ...(resolvedSubjectA ? { subjectA: resolvedSubjectA } : {}),
      ...(resolvedSubjectB ? { subjectB: resolvedSubjectB } : {}),
      ...(groupCount ?? defaults.groupCount
        ? { groupCount: groupCount ?? defaults.groupCount }
        : {}),
      offspringLabel: offspringLabel ?? defaults.offspringLabel ?? DEFAULT_OFFSPRING_LABEL,
      strikeMethod: strikeMethod ?? defaults.strikeMethod ?? DEFAULT_STRIKE_METHOD,
      escapeDirection:
        escapeDirection ?? defaults.escapeDirection ?? DEFAULT_ESCAPE_DIRECTION,
      weatherHazard: weatherHazard ?? defaults.weatherHazard ?? DEFAULT_WEATHER_HAZARD,
      rutSeason: rutSeason ?? defaults.rutSeason ?? false,
      ...((foodItem?.trim() || defaults.foodItem)
        ? { foodItem: foodItem?.trim() || defaults.foodItem }
        : {}),
    };
  }, [
    escapeDirection,
    foodItem,
    groupCount,
    offspringLabel,
    predator,
    prey,
    rutSeason,
    storyMode,
    strikeMethod,
    subjectA,
    subjectB,
    weatherHazard,
  ]);

  const currentGenerateSubjectPairLabel = useMemo(
    () =>
      formatStoryModeSubjectPair({
        predator,
        prey,
        storyMode,
        subjectA: currentStorySubjectSnapshot.subjectA,
        subjectB: currentStorySubjectSnapshot.subjectB,
        groupCount: currentStorySubjectSnapshot.groupCount,
        offspringLabel: currentStorySubjectSnapshot.offspringLabel,
        strikeMethod: currentStorySubjectSnapshot.strikeMethod,
        escapeDirection: currentStorySubjectSnapshot.escapeDirection,
        weatherHazard: currentStorySubjectSnapshot.weatherHazard,
        rutSeason: currentStorySubjectSnapshot.rutSeason,
        foodItem: currentStorySubjectSnapshot.foodItem,
        habitatRegion,
        season,
        timeOfDay,
      }),
    [
      currentStorySubjectSnapshot.escapeDirection,
      currentStorySubjectSnapshot.foodItem,
      currentStorySubjectSnapshot.groupCount,
      currentStorySubjectSnapshot.offspringLabel,
      currentStorySubjectSnapshot.rutSeason,
      currentStorySubjectSnapshot.strikeMethod,
      currentStorySubjectSnapshot.subjectA,
      currentStorySubjectSnapshot.subjectB,
      currentStorySubjectSnapshot.weatherHazard,
      habitatRegion,
      predator,
      prey,
      season,
      storyMode,
      timeOfDay,
    ]
  );

  const currentGenerateCtaLabel = useMemo(
    () =>
      formatStoryModeGenerateCtaLabel({
        predator,
        prey,
        storyMode,
        subjectA: currentStorySubjectSnapshot.subjectA,
        subjectB: currentStorySubjectSnapshot.subjectB,
        groupCount: currentStorySubjectSnapshot.groupCount,
        offspringLabel: currentStorySubjectSnapshot.offspringLabel,
        strikeMethod: currentStorySubjectSnapshot.strikeMethod,
        escapeDirection: currentStorySubjectSnapshot.escapeDirection,
        weatherHazard: currentStorySubjectSnapshot.weatherHazard,
        rutSeason: currentStorySubjectSnapshot.rutSeason,
        foodItem: currentStorySubjectSnapshot.foodItem,
        habitatRegion,
        season,
        timeOfDay,
      }),
    [
      currentStorySubjectSnapshot.escapeDirection,
      currentStorySubjectSnapshot.foodItem,
      currentStorySubjectSnapshot.groupCount,
      currentStorySubjectSnapshot.offspringLabel,
      currentStorySubjectSnapshot.rutSeason,
      currentStorySubjectSnapshot.strikeMethod,
      currentStorySubjectSnapshot.subjectA,
      currentStorySubjectSnapshot.subjectB,
      currentStorySubjectSnapshot.weatherHazard,
      habitatRegion,
      predator,
      prey,
      season,
      storyMode,
      timeOfDay,
    ]
  );

  const currentWorkflowPresetSnapshot = useMemo(
    () => ({
      predator,
      prey,
      storyMode,
      encounterMode,
      endingMode,
      viralLane,
      violenceLevel,
      habitatRegion,
      ...currentStorySubjectSnapshot,
      season,
      timeOfDay,
      wildlifeScopeMode,
      contentLane,
      actionStyle,
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
      storyMode,
      encounterMode,
      endingMode,
      viralLane,
      violenceLevel,
      habitatRegion,
      season,
      timeOfDay,
      actionStyle,
      cameraAnglePreset,
      contentLane,
      currentStorySubjectSnapshot,
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
      storyMode,
      encounterMode,
      endingMode,
      viralLane,
      violenceLevel: String(violenceLevel),
      habitatRegion,
      season,
      timeOfDay,
      ...(currentStorySubjectSnapshot.subjectA
        ? { subjectA: currentStorySubjectSnapshot.subjectA }
        : {}),
      ...(currentStorySubjectSnapshot.subjectB
        ? { subjectB: currentStorySubjectSnapshot.subjectB }
        : {}),
      ...(currentStorySubjectSnapshot.groupCount
        ? { groupCount: String(currentStorySubjectSnapshot.groupCount) }
        : {}),
      ...(currentStorySubjectSnapshot.offspringLabel
        ? { offspringLabel: currentStorySubjectSnapshot.offspringLabel }
        : {}),
      ...(currentStorySubjectSnapshot.strikeMethod
        ? { strikeMethod: currentStorySubjectSnapshot.strikeMethod }
        : {}),
      ...(currentStorySubjectSnapshot.escapeDirection
        ? { escapeDirection: currentStorySubjectSnapshot.escapeDirection }
        : {}),
      ...(currentStorySubjectSnapshot.weatherHazard
        ? { weatherHazard: currentStorySubjectSnapshot.weatherHazard }
        : {}),
      ...(currentStorySubjectSnapshot.rutSeason !== undefined
        ? { rutSeason: String(currentStorySubjectSnapshot.rutSeason) }
        : {}),
      ...(currentStorySubjectSnapshot.foodItem
        ? { foodItem: currentStorySubjectSnapshot.foodItem }
        : {}),
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
    currentStorySubjectSnapshot,
    finalEnvironment,
    habitat,
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

  const handlePinCurrentOutput = useCallback(() => {
    if (!pkg) {
      return;
    }

    const pinned = buildPinnedGeneratedOutput({
      id: pkg.generationId,
      createdAt: pkg.generatedAt,
      predator,
      prey,
      arc: previewArc,
      contentLane,
      habitat,
      weather,
      depthMode,
      cameraAnglePreset,
      emotionalTone,
      animalVibe,
      finalEnvironment,
      sceneDescription,
      pkg,
    });

    setPinnedOutput(pinned);
  }, [
    animalVibe,
    cameraAnglePreset,
    contentLane,
    depthMode,
    emotionalTone,
    finalEnvironment,
    habitat,
    pkg,
    predator,
    prey,
    previewArc,
    sceneDescription,
    weather,
  ]);

  const handleRestorePinnedOutput = useCallback(() => {
    if (!pinnedOutput) {
      return;
    }

    setPkg(pinnedOutput.package);
    setPublishFlowSummary(null);
    setLastGeneratedRestoreNotice(
      "Restored pinned output as the current generated package. Step 1 and Step 2 setup values stay unchanged."
    );
    setEnhancementNotice(null);
    setError("");
    setShouldRecordCreatorQaRun(false);
    setStep(3);
    setActiveTab("build");
  }, [pinnedOutput]);

  useEffect(() => {
    if (!shouldRecordCreatorQaRun || !pkg) {
      return;
    }

    const matchedWorkflowTestPreset = WORKFLOW_TEST_PRESETS.find(
      (presetCandidate) =>
        presetCandidate.snapshot.predator === predator &&
        presetCandidate.snapshot.prey === prey
    );
    const run = buildCreatorQaRun({
      id: pkg.generationId,
      createdAt: pkg.generatedAt,
      presetName: matchedWorkflowTestPreset?.label,
      predator,
      prey,
      arc: previewArc,
      contentLane,
      habitat,
      weather,
      depthMode,
      cameraAnglePreset,
      emotionalTone,
      animalVibe,
      finalEnvironment,
      sceneDescription,
      pkg,
    });

    if (lastRecordedCreatorQaRunIdRef.current === run.id) {
      setShouldRecordCreatorQaRun(false);
      return;
    }

    lastRecordedCreatorQaRunIdRef.current = run.id;
    setCreatorQaRuns((history) => appendCreatorQaRun(history, run));
    setShouldRecordCreatorQaRun(false);
  }, [
    animalVibe,
    cameraAnglePreset,
    contentLane,
    depthMode,
    emotionalTone,
    finalEnvironment,
    habitat,
    pkg,
    predator,
    prey,
    previewArc,
    sceneDescription,
    shouldRecordCreatorQaRun,
    weather,
  ]);



  const {
    handleGenerate,
    handleRegenerateUnlockedSections,
    handleRestoreVersion,
    handleTogglePackageLock,
  } = useBuildGenerationActions({
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
    subjectA: currentStorySubjectSnapshot.subjectA,
    subjectB: currentStorySubjectSnapshot.subjectB,
    groupCount: currentStorySubjectSnapshot.groupCount,
    offspringLabel: currentStorySubjectSnapshot.offspringLabel,
    strikeMethod: currentStorySubjectSnapshot.strikeMethod,
    escapeDirection: currentStorySubjectSnapshot.escapeDirection,
    weatherHazard: currentStorySubjectSnapshot.weatherHazard,
    rutSeason: currentStorySubjectSnapshot.rutSeason,
    foodItem: currentStorySubjectSnapshot.foodItem,
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
    onGenerated: () => {
      setLastGeneratedRestoreNotice(null);
      setShouldRecordCreatorQaRun(true);
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

  const storyboardHandoffPayload = useMemo(
    () => ({
      source: "build",
      leadAnimal: predator,
      opposingAnimal: prey,
      storyMode,
      encounterMode,
      endingMode,
      viralLane,
      violenceLevel,
      habitatRegion,
      season,
      timeOfDay,
      subjectA: currentStorySubjectSnapshot.subjectA,
      subjectB: currentStorySubjectSnapshot.subjectB,
      groupCount: currentStorySubjectSnapshot.groupCount,
      offspringLabel: currentStorySubjectSnapshot.offspringLabel,
      strikeMethod: currentStorySubjectSnapshot.strikeMethod,
      escapeDirection: currentStorySubjectSnapshot.escapeDirection,
      weatherHazard: currentStorySubjectSnapshot.weatherHazard,
      rutSeason: currentStorySubjectSnapshot.rutSeason,
      foodItem: currentStorySubjectSnapshot.foodItem,
      environment: finalEnvironment,
      lighting: weather,
      visualStyle: [
        "photorealistic wildlife documentary",
        "cinematic realism",
        emotionalTone,
        animalVibe,
        cameraAnglePreset,
        depthMode,
      ].join(", "),
      reelType: [contentLane, previewArc, durationLane].join(" • "),
      safetyRule:
        "Clean survival tension only. No blood, no gore, no visible injury; preserve realistic animal behavior and Facebook-safe documentary framing.",
      createdAt: new Date().toISOString(),
    }),
    [
      animalVibe,
      cameraAnglePreset,
      contentLane,
      depthMode,
      durationLane,
      emotionalTone,
      currentStorySubjectSnapshot,
      finalEnvironment,
      storyMode,
      encounterMode,
      endingMode,
      viralLane,
      violenceLevel,
      habitatRegion,
      season,
      timeOfDay,
      predator,
      prey,
      previewArc,
      weather,
    ]
  );

  const saveStoryboardHandoff = useCallback(() => {
    window.localStorage.setItem(
      STORYBOARD_HANDOFF_KEY,
      JSON.stringify(storyboardHandoffPayload)
    );
  }, [storyboardHandoffPayload]);

  const openStoryboardWorkflow = useCallback(() => {
    saveStoryboardHandoff();
    window.location.assign(currentStoryboardHref);
  }, [currentStoryboardHref, saveStoryboardHandoff]);
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
                      href={currentStoryboardHref}
                      onClick={saveStoryboardHandoff}
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
                  onClick={saveStoryboardHandoff}
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
                storyMode={storyMode}
                encounterMode={encounterMode}
                endingMode={endingMode}
                viralLane={viralLane}
                violenceLevel={violenceLevel}
                habitatRegion={habitatRegion}
                season={season}
                timeOfDay={timeOfDay}
                subjectA={subjectA}
                subjectB={subjectB}
                groupCount={groupCount}
                offspringLabel={offspringLabel}
                strikeMethod={strikeMethod}
                escapeDirection={escapeDirection}
                weatherHazard={weatherHazard}
                rutSeason={rutSeason}
                foodItem={foodItem}
                wildlifeScopeMode={wildlifeScopeMode}
                contentLane={contentLane}
                cameraAnglePreset={cameraAnglePreset}
                arc={arc}
                weather={weather}
                depthMode={depthMode}
                habitat={habitat}
                emotionalTone={emotionalTone}
                animalVibe={animalVibe}
                durationLane={durationLane}
                hookMode={hookMode}
                fastPublishMode={fastPublishMode}
                strictOriginalityGuard={strictOriginalityGuard}
                actionStyle={actionStyle}
                qualityPanelProps={qualityPanelProps}
                predatorOptions={predatorOptions}
                preyOptions={previewPreyOptions}
                customPredatorCount={customPredators.length}
                finalEnvironment={finalEnvironment}
                storyboardHref={currentStoryboardHref}
                onOpenStoryboardWorkflow={openStoryboardWorkflow}
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
                onStoryModeChange={handleStoryModeChange}
                onEncounterModeChange={setEncounterMode}
                onEndingModeChange={setEndingMode}
                onViralLaneChange={setViralLane}
                onViolenceLevelChange={setViolenceLevel}
                onHabitatRegionChange={setHabitatRegion}
                onSeasonChange={setSeason}
                onTimeOfDayChange={setTimeOfDay}
                onSubjectAChange={setSubjectA}
                onSubjectBChange={setSubjectB}
                onGroupCountChange={setGroupCount}
                onOffspringLabelChange={setOffspringLabel}
                onStrikeMethodChange={setStrikeMethod}
                onEscapeDirectionChange={setEscapeDirection}
                onWeatherHazardChange={setWeatherHazard}
                onRutSeasonChange={setRutSeason}
                onFoodItemChange={setFoodItem}
                onWildlifeScopeModeChange={setWildlifeScopeMode}
                onContentLaneChange={setContentLane}
                onCameraAnglePresetChange={setCameraAnglePreset}
                onWeatherChange={setWeather}
                onDepthModeChange={setDepthMode}
                onHabitatChange={setHabitat}
                onEmotionalToneChange={setEmotionalTone}
                onAnimalVibeChange={setAnimalVibe}
                onDurationLaneChange={setDurationLane}
                onHookModeChange={setHookMode}
                onToggleFastPublishMode={() => setFastPublishMode((value) => !value)}
                onToggleStrictOriginalityGuard={() =>
                  setStrictOriginalityGuard((value) => !value)
                }
                onActionStyleChange={setActionStyle}
                onApplyWorkflowTestPreset={handleApplyWorkflowTestPreset}
                onApplyStoryModePreset={handleApplyStoryModePreset}
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
                actionStyle={actionStyle}
                sceneDescriptionMode={sceneDescriptionMode}
                sceneDescriptionTouched={sceneDescriptionTouched}
                sceneMode={sceneMode}
                onActionStyleChange={setActionStyle}
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
                subjectPairLabel={currentGenerateSubjectPairLabel}
                generateCtaLabel={currentGenerateCtaLabel}
                contentLane={contentLane}
                activeProvider={activeProvider}
                autoFallback={autoFallback}
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
                onAutoFallbackChange={setAutoFallback}
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
                onApplyStoryModePreset={handleApplyStoryModePreset}
                lastGeneratedRestoreNotice={lastGeneratedRestoreNotice}
                onDismissLastGeneratedRestoreNotice={() =>
                  setLastGeneratedRestoreNotice(null)
                }
                creatorQaRuns={creatorQaRuns}
                pinnedOutput={pinnedOutput}
                onPinCurrentOutput={handlePinCurrentOutput}
                onRestorePinnedOutput={handleRestorePinnedOutput}
                onClearPinnedOutput={() => setPinnedOutput(null)}
                onClearCreatorQaRuns={() => setCreatorQaRuns([])}
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
