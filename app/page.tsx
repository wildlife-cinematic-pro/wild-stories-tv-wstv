"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { BRAND_NAME } from "@/lib/brand";

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
  VideoModelProviderGroup,
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
  type LastGeneratedOutputRecord,
} from "@/lib/storage";

import {
  RUNWAY_MODELS,
  KLING_MODELS,
} from "@/lib/model-specs";
import {
  getDefaultSelectedVideoModelId,
  getVideoModelCapabilityById,
  getVideoModelSelectionPatch,
} from "@/lib/video-model-capabilities";
import { DEFAULT_CAMERA_ANGLE_PRESET } from "@/lib/camera-angle-presets";
import { buildStoryboardPreviewLinkMetadata } from "@/lib/storyboard-link-metadata";
import {
  FOUR_SHOT_PHOTO_HANDOFF_KEY,
  buildFourShotPhotoHandoffPayloadFromBuildSetup,
} from "@/lib/four-shot-photo-handoff";
import { WORKFLOW_TEST_PRESETS } from "@/lib/workflow-presets";
import {
  formatStoryModeGenerateCtaLabel,
  formatStoryModeSubjectPair,
} from "@/lib/story-mode-prompt-context";
import type { RecommendedSeasonalSetup } from "@/lib/seasonal-realism-advisor";
import type { StoryModePreset } from "@/lib/story-mode-presets";
import {
  rankStoryModeSetups,
  type RankedStoryModeSetup,
} from "@/lib/story-mode-setup-ranking";
import { getStoryModeAnimalOptions } from "@/lib/story-mode-subject-options";
import { evaluateHabitatCompatibility } from "@/lib/story-mode-habitat-quality";
import { areAnimalNamesEquivalent } from "@/lib/story-mode-animal-pairings";
import {
  buildStorySetupTunerPatch,
  type StorySetupTunerId,
} from "@/lib/story-setup-tuners";
import {
  applyMyWorkflowPreset,
  buildMyWorkflowPresetName,
  canUseMyWorkflowPresetStorage,
  createMyWorkflowPreset,
  deleteMyWorkflowPresetFromList,
  loadMyWorkflowPresets,
  renameMyWorkflowPresetInList,
  saveMyWorkflowPresets,
  upsertMyWorkflowPresetInList,
  type MyWorkflowPreset,
  type MyWorkflowPresetSnapshot,
} from "@/lib/my-workflow-presets";
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
import {
  StudioActionBar,
  StudioDiagramFrame,
  StudioPanel,
  StudioSectionHeader,
  StudioStatusPill,
  StudioTabs,
} from "@/components/studio-layout";
import CustomAnimalModal from "@/components/build/custom-animal-modal";
import Step1Setup from "@/components/build/step-1-setup";
import {
  getStoryModeSubjectDefaults,
  type StoryModeSubjectValues,
} from "@/lib/story-mode-subject-defaults";
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
  const [storyModeSubjectDrafts, setStoryModeSubjectDrafts] = useState<
    Partial<Record<StoryMode, StoryModeSubjectValues>>
  >({});

  // STEP 2
  const [runwayModel, setRunwayModel] = useState<RunwayModel>(RUNWAY_MODELS[0]);
  const [klingModel, setKlingModel] = useState<KlingModel>(KLING_MODELS[0]);
  const defaultSelectedVideoModelId = getDefaultSelectedVideoModelId({
    runwayModel: RUNWAY_MODELS[0],
    klingModel: KLING_MODELS[0],
  });
  const [selectedVideoModelId, setSelectedVideoModelId] = useState(defaultSelectedVideoModelId);
  const [selectedVideoProviderGroup, setSelectedVideoProviderGroup] =
    useState<VideoModelProviderGroup>(
      getVideoModelCapabilityById(defaultSelectedVideoModelId)?.providerGroup ??
        "RUNWAY_NATIVE"
    );
  const [autoSelectRecommendedVideoModel, setAutoSelectRecommendedVideoModel] =
    useState(false);
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
  const [setupFixFeedback, setSetupFixFeedback] = useState<string | null>(null);
  const [myWorkflowPresets, setMyWorkflowPresets] = useState<MyWorkflowPreset[]>([]);
  const [myWorkflowPresetStatus, setMyWorkflowPresetStatus] = useState("");
  const [myWorkflowPresetStorageWarning, setMyWorkflowPresetStorageWarning] =
    useState("");

  // Navigation
  const [step, setStep] = useState<Step>(1);
  const [activeTab, setActiveTab] = useState<TopTab>("build");
  const [workflowTab, setWorkflowTab] = useState<WorkflowTab>("wstv");
  const [pendingQaTarget, setPendingQaTarget] = useState<{ step: Step; targetId: string } | null>(null);

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
  const [availableLastGeneratedOutput, setAvailableLastGeneratedOutput] =
    useState<LastGeneratedOutputRecord | null>(null);
  const [lastGeneratedOutputBannerDismissed, setLastGeneratedOutputBannerDismissed] =
    useState(false);
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
      setStoryModeSubjectDrafts({});
      setRunwayModel(snapshot.runwayModel);
      setKlingModel(snapshot.klingModel);
      {
        const nextVideoModelId = getDefaultSelectedVideoModelId({
          selectedVideoModelId: snapshot.selectedVideoModelId,
          runwayModel: snapshot.runwayModel,
          klingModel: snapshot.klingModel,
        });
        const nextVideoModel = getVideoModelCapabilityById(nextVideoModelId);
        setSelectedVideoModelId(nextVideoModelId);
        setSelectedVideoProviderGroup(
          snapshot.selectedVideoProviderGroup ??
            nextVideoModel?.providerGroup ??
            "RUNWAY_NATIVE"
        );
      }
      setAutoSelectRecommendedVideoModel(
        snapshot.autoSelectRecommendedVideoModel === true
      );
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
    setStoryModeSubjectDrafts({});
    setPromotedPublishCopyOverride(null);
  }

  const getCurrentStoryModeSubjectDraft = useCallback<() => StoryModeSubjectValues>(
    () => ({
      subjectA,
      subjectB,
      groupCount,
      offspringLabel,
      strikeMethod,
      escapeDirection,
      weatherHazard,
      rutSeason,
      foodItem,
    }),
    [
      escapeDirection,
      foodItem,
      groupCount,
      offspringLabel,
      rutSeason,
      strikeMethod,
      subjectA,
      subjectB,
      weatherHazard,
    ]
  );

  const applyStoryModeSubjectValues = useCallback(
    (values: StoryModeSubjectValues) => {
      setSubjectA(values.subjectA);
      setSubjectB(values.subjectB);
      setGroupCount(values.groupCount);
      setOffspringLabel(values.offspringLabel ?? DEFAULT_OFFSPRING_LABEL);
      setStrikeMethod(values.strikeMethod ?? DEFAULT_STRIKE_METHOD);
      setEscapeDirection(values.escapeDirection ?? DEFAULT_ESCAPE_DIRECTION);
      setWeatherHazard(values.weatherHazard ?? DEFAULT_WEATHER_HAZARD);
      setRutSeason(values.rutSeason ?? false);
      setFoodItem(values.foodItem);
    },
    []
  );

  const handleStoryModeChange = useCallback(
    (value: StoryMode) => {
      if (value === storyMode) return;

      const currentDraft = getCurrentStoryModeSubjectDraft();
      const defaults = getStoryModeSubjectDefaults(value, predator, prey);
      const nextValues = storyModeSubjectDrafts[value] ?? defaults;

      setStoryModeSubjectDrafts((current) => ({
        ...current,
        [storyMode]: currentDraft,
      }));
      setStoryMode(value);
      applyStoryModeSubjectValues(nextValues);
    },
    [
      applyStoryModeSubjectValues,
      getCurrentStoryModeSubjectDraft,
      predator,
      prey,
      storyMode,
      storyModeSubjectDrafts,
    ]
  );

  const handleResetStoryModeSubjectDefaults = useCallback(() => {
    const defaults = getStoryModeSubjectDefaults(storyMode, predator, prey);
    setSubjectA(defaults.subjectA);
    setSubjectB(defaults.subjectB);
    setGroupCount(defaults.groupCount);
    setOffspringLabel(defaults.offspringLabel ?? DEFAULT_OFFSPRING_LABEL);
    setStrikeMethod(defaults.strikeMethod ?? DEFAULT_STRIKE_METHOD);
    setEscapeDirection(defaults.escapeDirection ?? DEFAULT_ESCAPE_DIRECTION);
    setWeatherHazard(defaults.weatherHazard ?? DEFAULT_WEATHER_HAZARD);
    setRutSeason(defaults.rutSeason ?? false);
    setFoodItem(defaults.foodItem);
    setStoryModeSubjectDrafts((current) => ({
      ...current,
      [storyMode]: defaults,
    }));
  }, [predator, prey, storyMode]);

  const handleApplyRankedStoryModeSetup = useCallback(
    (setup: RankedStoryModeSetup) => {
      const defaults = getStoryModeSubjectDefaults(setup.storyMode, predator, prey);
      const nextValues: StoryModeSubjectValues = {
        ...defaults,
        subjectA: setup.subjectA,
        subjectB: setup.subjectB,
      };

      setStoryModeSubjectDrafts((current) => ({
        ...current,
        [storyMode]: getCurrentStoryModeSubjectDraft(),
        [setup.storyMode]: nextValues,
      }));
      setStoryMode(setup.storyMode);
      setHabitatRegion(setup.habitatRegion);
      setSeason(setup.season);
      setTimeOfDay(setup.timeOfDay);
      applyStoryModeSubjectValues(nextValues);
      setPromotedPublishCopyOverride(null);
      setError("");
      setStep(1);
      setActiveTab("build");
    },
    [
      applyStoryModeSubjectValues,
      getCurrentStoryModeSubjectDraft,
      predator,
      prey,
      storyMode,
    ]
  );

  const handleApplyStorySetupTuner = useCallback(
    (id: StorySetupTunerId) => {
      const { patch } = buildStorySetupTunerPatch({ id, storyMode });

      if (patch.actionStyle) setActionStyle(patch.actionStyle);
      if (patch.animalVibe) setAnimalVibe(patch.animalVibe);
      if (patch.arc) {
        setArc(patch.arc);
        setConceptArcOverride(null);
      }
      if (patch.cameraAnglePreset) setCameraAnglePreset(patch.cameraAnglePreset);
      if (patch.contentLane) setContentLane(patch.contentLane);
      if (patch.depthMode) setDepthMode(patch.depthMode);
      if (patch.emotionalTone) setEmotionalTone(patch.emotionalTone);
      if (patch.encounterMode) setEncounterMode(patch.encounterMode);
      if (patch.endingMode) setEndingMode(patch.endingMode);
      if (patch.hookMode) setHookMode(patch.hookMode);
      if (patch.strictOriginalityGuard !== undefined) {
        setStrictOriginalityGuard(patch.strictOriginalityGuard);
      }
      if (patch.timeOfDay) setTimeOfDay(patch.timeOfDay);
      if (patch.viralLane) setViralLane(patch.viralLane);
      if (patch.violenceLevel) setViolenceLevel(patch.violenceLevel);
      if (patch.weather) setWeather(patch.weather);

      setPromotedPublishCopyOverride(null);
      setSetupFixFeedback(null);
      setError("");
    },
    [storyMode]
  );

  const handleApplyStoryModePreset = useCallback((preset: StoryModePreset) => {
    setStoryModeSubjectDrafts((current) => ({
      ...current,
      [storyMode]: getCurrentStoryModeSubjectDraft(),
      [preset.storyMode]: {
        subjectA: preset.subjectA,
        subjectB: preset.subjectB,
        groupCount: preset.groupCount,
        offspringLabel: preset.offspringLabel,
        strikeMethod: preset.strikeMethod,
        escapeDirection: preset.escapeDirection,
        weatherHazard: preset.weatherHazard,
        rutSeason: preset.rutSeason,
        foodItem: preset.foodItem,
      },
    }));
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
  }, [getCurrentStoryModeSubjectDraft, storyMode]);

  const handleApplyRecommendedSeasonalSetup = useCallback(
    (setup: RecommendedSeasonalSetup) => {
      setStoryMode(setup.storyMode);

      if (setup.storyMode === StoryMode.PREDATOR_VS_PREY) {
        if (setup.subjectA) setPredator(setup.subjectA);
        if (setup.subjectB) setPrey(setup.subjectB);
      }

      setSubjectA(setup.subjectA);
      setSubjectB(setup.subjectB);
      setGroupCount(setup.groupCount);
      setOffspringLabel(setup.offspringLabel ?? DEFAULT_OFFSPRING_LABEL);
      setStrikeMethod(setup.strikeMethod ?? DEFAULT_STRIKE_METHOD);
      setEscapeDirection(setup.escapeDirection ?? DEFAULT_ESCAPE_DIRECTION);
      setWeatherHazard(setup.weatherHazard ?? DEFAULT_WEATHER_HAZARD);
      setRutSeason(setup.rutSeason ?? false);
      setFoodItem(setup.foodItem);

      if (setup.habitatRegion) {
        setHabitatRegion(setup.habitatRegion);
      }

      if (setup.season) {
        setSeason(setup.season);
      }

      setPromotedPublishCopyOverride(null);
      setError("");
      setStep(1);
      setActiveTab("build");
    },
    []
  );

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
    selectedVideoModelId,
    selectedVideoProviderGroup,
    autoSelectRecommendedVideoModel,
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
    setSelectedVideoModelId,
    setSelectedVideoProviderGroup,
    setAutoSelectRecommendedVideoModel,
    setRealismMode,
    setMotionOnlyI2V,
    setReferenceLock,
    setSingleActionRule,
    setMicroMotion,
    setHeroVeo,
    setAutoApplyHighDrift,
  });

  const handleOpenQaTarget = useCallback((targetStep: Step, targetId: string) => {
    setActiveTab("build");
    setPendingQaTarget({ step: targetStep, targetId });
    setStep(targetStep);
  }, []);

  useEffect(() => {
    if (!pendingQaTarget || step !== pendingQaTarget.step) return;

    const timeout = window.setTimeout(() => {
      const element = document.getElementById(pendingQaTarget.targetId);
      if (!element) return;

      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("qa-target-highlight");
      window.setTimeout(() => {
        element.classList.remove("qa-target-highlight");
      }, 2800);
      setPendingQaTarget(null);
    }, 80);

    return () => window.clearTimeout(timeout);
  }, [pendingQaTarget, step]);

  const handleVideoModelSelectionChange = useCallback((videoModelId: string) => {
    const patch = getVideoModelSelectionPatch(videoModelId);
    if (!patch) return;

    setSelectedVideoModelId(patch.selectedVideoModelId);
    setSelectedVideoProviderGroup(patch.selectedVideoProviderGroup);
    if (patch.runwayModel) {
      setRunwayModel(patch.runwayModel);
    }
    if (patch.klingModel) {
      setKlingModel(patch.klingModel);
    }
  }, []);

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

  const handleApplySetupFixAction = useCallback(
    (id: string) => {
      const currentSubjectA = currentStorySubjectSnapshot.subjectA ?? predator;
      const currentSubjectB = currentStorySubjectSnapshot.subjectB ?? prey;

      if (id === "suggest-better-pair") {
        const options = getStoryModeAnimalOptions({
          storyMode,
          field: "subjectB",
          animalOptions: predatorOptions,
          subjectA: currentSubjectA,
          subjectB: currentSubjectB,
        });
        const nextSubjectB = options.find(
          (option) => !areAnimalNamesEquivalent(option, currentSubjectB)
        );

        if (!nextSubjectB) {
          setSetupFixFeedback("No stronger matched pair was available for this setup.");
          return;
        }

        if (storyMode === StoryMode.PREDATOR_VS_PREY) {
          setPrey(nextSubjectB);
        } else {
          setSubjectB(nextSubjectB);
          setStoryModeSubjectDrafts((current) => ({
            ...current,
            [storyMode]: {
              ...getCurrentStoryModeSubjectDraft(),
              subjectB: nextSubjectB,
            },
          }));
        }

        setSetupFixFeedback(
          `Applied better pair: ${currentSubjectA} vs ${nextSubjectB}.`
        );
        setError("");
        return;
      }

      if (id === "suggest-better-habitat") {
        const rankedHabitats = Object.values(HabitatRegion)
          .map((candidate) => ({
            habitatRegion: candidate,
            quality: evaluateHabitatCompatibility({
              storyMode,
              subjectA: currentSubjectA,
              subjectB: currentSubjectB,
              habitatRegion: candidate,
              season,
              timeOfDay,
              animalOptions: predatorOptions,
            }),
          }))
          .sort((a, b) => b.quality.score - a.quality.score);
        const currentScore =
          rankedHabitats.find((item) => item.habitatRegion === habitatRegion)
            ?.quality.score ?? 0;
        const betterHabitat = rankedHabitats.find(
          (item) =>
            item.habitatRegion !== habitatRegion && item.quality.score > currentScore
        );

        if (!betterHabitat) {
          setSetupFixFeedback("No stronger habitat suggestion was available for this pair.");
          return;
        }

        setHabitatRegion(betterHabitat.habitatRegion);
        setSetupFixFeedback(
          `Applied better habitat: ${betterHabitat.habitatRegion.replace(/_/g, " ")}.`
        );
        setError("");
        return;
      }

      if (id === "make-non-graphic") {
        handleApplyStorySetupTuner("safer-non-graphic");
        setSetupFixFeedback("Applied safer non-graphic setup controls.");
        return;
      }

      if (id === "apply-best-viral-setup") {
        const topSetup = rankStoryModeSetups({
          storyMode,
          habitatRegion,
          season,
          timeOfDay,
          animalOptions: predatorOptions,
        })[0];

        if (!topSetup) {
          setSetupFixFeedback("No ranked viral setup was available.");
          return;
        }

        const defaults = getStoryModeSubjectDefaults(
          topSetup.storyMode,
          predator,
          prey
        );
        const nextValues: StoryModeSubjectValues = {
          ...defaults,
          subjectA: topSetup.subjectA,
          subjectB: topSetup.subjectB,
        };

        setStoryModeSubjectDrafts((current) => ({
          ...current,
          [storyMode]: getCurrentStoryModeSubjectDraft(),
          [topSetup.storyMode]: nextValues,
        }));
        setStoryMode(topSetup.storyMode);
        setHabitatRegion(topSetup.habitatRegion);
        setSeason(topSetup.season);
        setTimeOfDay(topSetup.timeOfDay);
        applyStoryModeSubjectValues(nextValues);
        setPromotedPublishCopyOverride(null);
        setSetupFixFeedback(
          `Applied best viral setup: ${topSetup.subjectA} vs ${topSetup.subjectB}.`
        );
        setError("");
        return;
      }

      if (id === "reset-smart-defaults") {
        handleResetStoryModeSubjectDefaults();
        setSetupFixFeedback("Reset smart defaults for the current story mode.");
        setError("");
      }
    },
    [
      applyStoryModeSubjectValues,
      currentStorySubjectSnapshot.subjectA,
      currentStorySubjectSnapshot.subjectB,
      getCurrentStoryModeSubjectDraft,
      handleApplyStorySetupTuner,
      handleResetStoryModeSubjectDefaults,
      habitatRegion,
      predator,
      predatorOptions,
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
      selectedVideoModelId,
      selectedVideoProviderGroup,
      autoSelectRecommendedVideoModel,
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
      selectedVideoModelId,
      selectedVideoProviderGroup,
      autoSelectRecommendedVideoModel,
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
      actionStyle,
      animalVibe,
      depthMode,
      emotionalTone,
      hookMode,
      strictOriginalityGuard: String(strictOriginalityGuard),
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
    actionStyle,
    animalVibe,
    cameraAnglePreset,
    contentLane,
    depthMode,
    durationLane,
    emotionalTone,
    hookMode,
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
    strictOriginalityGuard,
    weather,
  ]);

  const currentFourShotPhotoHref = useMemo(() => {
    const params = new URLSearchParams({
      source: "build",
      predator,
      prey,
      season,
      aspectRatio: "9:16",
      ...(currentStorySubjectSnapshot.subjectA
        ? { subjectA: currentStorySubjectSnapshot.subjectA }
        : {}),
      ...(currentStorySubjectSnapshot.subjectB
        ? { subjectB: currentStorySubjectSnapshot.subjectB }
        : {}),
      ...(finalEnvironment ? { finalEnvironment, environment: finalEnvironment } : {}),
      ...(habitatRegion ? { habitatRegion } : {}),
      ...(habitat ? { habitat } : {}),
      ...(weather ? { weather } : {}),
      ...(timeOfDay ? { timeOfDay } : {}),
      lighting: [timeOfDay, weather].filter(Boolean).join(", "),
      animalVibe,
      realismMode,
      referenceLock: String(referenceLock),
      ...(sceneDescription ? { sceneDescription } : {}),
    });

    return `/four-shot-photo?${params.toString()}`;
  }, [
    animalVibe,
    currentStorySubjectSnapshot,
    finalEnvironment,
    habitat,
    habitatRegion,
    predator,
    prey,
    realismMode,
    referenceLock,
    sceneDescription,
    season,
    timeOfDay,
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

  const currentMyWorkflowPresetSnapshot = useMemo<MyWorkflowPresetSnapshot>(
    () => ({
      storyMode,
      subjectA: currentStorySubjectSnapshot.subjectA,
      subjectB: currentStorySubjectSnapshot.subjectB,
      predator,
      prey,
      habitatRegion,
      season,
      timeOfDay,
      actionStyle,
      animalVibe,
      arc: previewArc,
      cameraAnglePreset,
      contentLane,
      depthMode,
      emotionalTone,
      encounterMode,
      endingMode,
      hookMode,
      strictOriginalityGuard,
      viralLane,
      violenceLevel,
      weather,
      runwayModel,
      klingModel,
      selectedVideoModelId,
      selectedVideoProviderGroup,
      autoSelectRecommendedVideoModel,
      activeProvider,
      autoFallback,
      habitat,
      durationLane,
      fastPublishMode,
      realismMode,
      motionOnlyI2V,
      referenceLock,
      singleActionRule,
      microMotion,
      heroVeo,
    }),
    [
      activeProvider,
      actionStyle,
      animalVibe,
      autoFallback,
      cameraAnglePreset,
      contentLane,
      currentStorySubjectSnapshot.subjectA,
      currentStorySubjectSnapshot.subjectB,
      depthMode,
      durationLane,
      emotionalTone,
      encounterMode,
      endingMode,
      fastPublishMode,
      habitat,
      habitatRegion,
      heroVeo,
      hookMode,
      klingModel,
      selectedVideoModelId,
      selectedVideoProviderGroup,
      autoSelectRecommendedVideoModel,
      microMotion,
      motionOnlyI2V,
      predator,
      prey,
      previewArc,
      realismMode,
      referenceLock,
      runwayModel,
      season,
      singleActionRule,
      storyMode,
      strictOriginalityGuard,
      timeOfDay,
      viralLane,
      violenceLevel,
      weather,
    ]
  );

  const suggestedMyWorkflowPresetName = useMemo(
    () => buildMyWorkflowPresetName(currentMyWorkflowPresetSnapshot),
    [currentMyWorkflowPresetSnapshot]
  );

  useEffect(() => {
    setMyWorkflowPresets(loadMyWorkflowPresets());
    setMyWorkflowPresetStorageWarning(
      canUseMyWorkflowPresetStorage()
        ? ""
        : "LocalStorage is unavailable, so presets may not persist after refresh."
    );
  }, []);

  const persistMyWorkflowPresets = useCallback(
    (nextPresets: MyWorkflowPreset[], status: string) => {
      const saved = saveMyWorkflowPresets(nextPresets);
      setMyWorkflowPresets(nextPresets);
      setMyWorkflowPresetStatus(
        saved
          ? status
          : status + " LocalStorage is unavailable, so this may be session-only."
      );
    },
    []
  );

  const handleSaveMyWorkflowPreset = useCallback(
    (name: string) => {
      const preset = createMyWorkflowPreset(currentMyWorkflowPresetSnapshot, name);
      const nextPresets = upsertMyWorkflowPresetInList(myWorkflowPresets, preset);
      persistMyWorkflowPresets(nextPresets, "Saved workflow preset: " + preset.name + ".");
    },
    [currentMyWorkflowPresetSnapshot, myWorkflowPresets, persistMyWorkflowPresets]
  );

  const handleRenameMyWorkflowPreset = useCallback(
    (id: string, name: string) => {
      const nextPresets = renameMyWorkflowPresetInList(myWorkflowPresets, id, name);
      const renamedPreset = nextPresets.find((preset) => preset.id === id);
      persistMyWorkflowPresets(
        nextPresets,
        renamedPreset ? "Renamed workflow preset: " + renamedPreset.name + "." : "Preset renamed."
      );
    },
    [myWorkflowPresets, persistMyWorkflowPresets]
  );

  const handleDeleteMyWorkflowPreset = useCallback(
    (id: string) => {
      const deletedPreset = myWorkflowPresets.find((preset) => preset.id === id);
      const nextPresets = deleteMyWorkflowPresetFromList(myWorkflowPresets, id);
      persistMyWorkflowPresets(
        nextPresets,
        deletedPreset ? "Deleted workflow preset: " + deletedPreset.name + "." : "Preset deleted."
      );
    },
    [myWorkflowPresets, persistMyWorkflowPresets]
  );

  const handleApplyMyWorkflowPreset = useCallback(
    (id: string) => {
      const preset = myWorkflowPresets.find((candidate) => candidate.id === id);
      if (!preset) return;

      const snapshot = applyMyWorkflowPreset(preset);
      const nextSubjectValues = {
        subjectA: snapshot.subjectA,
        subjectB: snapshot.subjectB,
      };

      setStoryModeSubjectDrafts((current) => ({
        ...current,
        [storyMode]: getCurrentStoryModeSubjectDraft(),
        [snapshot.storyMode]: nextSubjectValues,
      }));
      setPredator(snapshot.predator);
      setPrey(snapshot.prey);
      setStoryMode(snapshot.storyMode);
      applyStoryModeSubjectValues(nextSubjectValues);
      setHabitatRegion(snapshot.habitatRegion);
      setSeason(snapshot.season);
      setTimeOfDay(snapshot.timeOfDay);
      setActionStyle(snapshot.actionStyle);
      setAnimalVibe(snapshot.animalVibe);
      setArc(snapshot.arc);
      setConceptArcOverride(null);
      setCameraAnglePreset(snapshot.cameraAnglePreset);
      setContentLane(snapshot.contentLane);
      setDepthMode(snapshot.depthMode);
      setEmotionalTone(snapshot.emotionalTone);
      setEncounterMode(snapshot.encounterMode);
      setEndingMode(snapshot.endingMode);
      setHookMode(snapshot.hookMode);
      setStrictOriginalityGuard(snapshot.strictOriginalityGuard);
      setViralLane(snapshot.viralLane);
      setViolenceLevel(snapshot.violenceLevel);
      setWeather(snapshot.weather);
      setRunwayModel(snapshot.runwayModel);
      setKlingModel(snapshot.klingModel);
      {
        const nextVideoModelId = getDefaultSelectedVideoModelId({
          selectedVideoModelId: snapshot.selectedVideoModelId,
          runwayModel: snapshot.runwayModel,
          klingModel: snapshot.klingModel,
        });
        const nextVideoModel = getVideoModelCapabilityById(nextVideoModelId);
        setSelectedVideoModelId(nextVideoModelId);
        setSelectedVideoProviderGroup(
          snapshot.selectedVideoProviderGroup ??
            nextVideoModel?.providerGroup ??
            "RUNWAY_NATIVE"
        );
      }
      setAutoSelectRecommendedVideoModel(
        snapshot.autoSelectRecommendedVideoModel === true
      );
      setActiveProvider(snapshot.activeProvider);
      setAutoFallback(snapshot.autoFallback);
      if (snapshot.habitat) setHabitat(snapshot.habitat);
      if (snapshot.durationLane) setDurationLane(snapshot.durationLane);
      if (snapshot.fastPublishMode !== undefined) {
        setFastPublishMode(snapshot.fastPublishMode);
      }
      if (snapshot.realismMode) setRealismMode(snapshot.realismMode);
      if (snapshot.motionOnlyI2V !== undefined) setMotionOnlyI2V(snapshot.motionOnlyI2V);
      if (snapshot.referenceLock !== undefined) setReferenceLock(snapshot.referenceLock);
      if (snapshot.singleActionRule !== undefined) {
        setSingleActionRule(snapshot.singleActionRule);
      }
      if (snapshot.microMotion !== undefined) setMicroMotion(snapshot.microMotion);
      if (snapshot.heroVeo !== undefined) setHeroVeo(snapshot.heroVeo);
      setPromotedPublishCopyOverride(null);
      setSetupFixFeedback(null);
      setError("");
      setMyWorkflowPresetStatus("Applied workflow preset: " + preset.name + ".");
      setStep(1);
      setActiveTab("build");
    },
    [
      applyStoryModeSubjectValues,
      getCurrentStoryModeSubjectDraft,
      myWorkflowPresets,
      storyMode,
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

  const restoreLastGeneratedOutput = useCallback(
    (restoredOutput: LastGeneratedOutputRecord) => {
      applyBuildSnapshot(restoredOutput.snapshot, { clearGeneratedOutput: false });
      setPkg(restoredOutput.pkg);
      setPublishFlowSummary(restoredOutput.publishFlowSummary);
      setPackageLocks(restoredOutput.packageLocks);
      setStep(3);
      setActiveTab("build");
      setLastGeneratedRestoreNotice(
        "Restored your last generated output from this browser."
      );
      setAvailableLastGeneratedOutput(null);
      setLastGeneratedOutputBannerDismissed(true);
    },
    [applyBuildSnapshot]
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

    setAvailableLastGeneratedOutput(restoredOutput);
    setLastGeneratedOutputBannerDismissed(false);
  }, []);

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

  const currentPromptSubjectA = currentStorySubjectSnapshot.subjectA ?? predator;
  const currentPromptSubjectB = currentStorySubjectSnapshot.subjectB ?? prey;

  useEffect(() => {
    setConceptArcOverride(null);
  }, [currentPromptSubjectA, currentPromptSubjectB, contentLane]);

  const {
    variants: conceptVariants,
    winners: conceptVariantWinners,
    activeVariantId: activeConceptVariantId,
    promoteVariant: promoteConceptVariant,
    autoCleanupVariant: autoCleanupConceptVariant,
  } = useConceptVariantLab({
    predator: currentPromptSubjectA,
    prey: currentPromptSubjectB,
    contentLane,
    currentArc: previewArc,
    currentHabitat: habitat,
    presetEnvironment: finalEnvironment,
    presetPrey: [currentPromptSubjectB],
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

    const qaPredator = pkg.predatorName ?? predator;
    const qaPrey = pkg.preyName ?? prey;
    const matchedWorkflowTestPreset = WORKFLOW_TEST_PRESETS.find(
      (presetCandidate) =>
        presetCandidate.snapshot.predator === qaPredator &&
        presetCandidate.snapshot.prey === qaPrey
    );
    const run = buildCreatorQaRun({
      id: pkg.generationId,
      createdAt: pkg.generatedAt,
      presetName: matchedWorkflowTestPreset?.label,
      predator: qaPredator,
      prey: qaPrey,
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
    selectedVideoModelId,
    selectedVideoProviderGroup,
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

  const storyboardHandoffPayload = useMemo(
    () => ({
      source: "build",
      leadAnimal: predator,
      opposingAnimal: prey,
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
      actionStyle,
      animalVibe,
      arc: previewArc,
      cameraAnglePreset,
      contentLane,
      depthMode,
      emotionalTone,
      hookMode,
      strictOriginalityGuard,
      weather,
      environment: finalEnvironment,
      finalEnvironment,
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
      activeProvider,
      autoFallback,
      createdAt: new Date().toISOString(),
    }),
    [
      animalVibe,
      cameraAnglePreset,
      actionStyle,
      contentLane,
      depthMode,
      durationLane,
      emotionalTone,
      hookMode,
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
      strictOriginalityGuard,
      weather,
      activeProvider,
      autoFallback,
    ]
  );

  const fourShotPhotoHandoffPayload = useMemo(
    () =>
      buildFourShotPhotoHandoffPayloadFromBuildSetup({
        source: "build",
        predator,
        prey,
        subjectA: currentStorySubjectSnapshot.subjectA,
        subjectB: currentStorySubjectSnapshot.subjectB,
        habitatRegion,
        habitat,
        finalEnvironment,
        weather,
        timeOfDay,
        season,
        aspectRatio: "9:16",
        animalVibe,
        realismMode,
        referenceLock,
        sceneDescription,
        activeProvider,
        autoFallback,
      }),
    [
      animalVibe,
      currentStorySubjectSnapshot,
      finalEnvironment,
      habitat,
      habitatRegion,
      predator,
      prey,
      realismMode,
      referenceLock,
      sceneDescription,
      season,
      timeOfDay,
      weather,
      activeProvider,
      autoFallback,
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

  const saveFourShotPhotoHandoff = useCallback(() => {
    window.localStorage.setItem(
      FOUR_SHOT_PHOTO_HANDOFF_KEY,
      JSON.stringify(fourShotPhotoHandoffPayload)
    );
  }, [fourShotPhotoHandoffPayload]);

  const openFourShotPhotoWorkflow = useCallback(() => {
    saveFourShotPhotoHandoff();
    window.location.assign(currentFourShotPhotoHref);
  }, [currentFourShotPhotoHref, saveFourShotPhotoHandoff]);
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
                  <span className="truncate text-sm font-bold tracking-tight text-white sm:text-[15px]">{BRAND_NAME.toUpperCase()}</span>
                  <span className="hidden text-[10px] font-medium text-white/35 sm:inline">WSTV Production Studio</span>
                </div>
                <div className="mt-0.5 text-[10px] font-medium text-white/30 sm:hidden">Production Studio</div>
              </div>
            </div>

            {/* Top-level tab switcher — compact segmented control */}
            <div className="order-3 flex w-full justify-start sm:order-2 sm:flex-1 sm:justify-center">
              <nav className="flex max-w-full items-center overflow-x-auto rounded-2xl border border-white/[0.08] bg-white/[0.04] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                  Image
                </Link>
                <Link
                  href="/storyboard"
                  className="group flex items-center gap-2 rounded-xl border border-transparent px-3.5 py-2 text-xs font-semibold tracking-[0.01em] text-white/50 transition-all hover:bg-white/[0.06] hover:text-white/80"
                >
                  Storyboard
                </Link>
                <Link
                  href={currentFourShotPhotoHref}
                  onClick={saveFourShotPhotoHandoff}
                  className="group flex items-center gap-2 rounded-xl border border-transparent px-3.5 py-2 text-xs font-semibold tracking-[0.01em] text-white/50 transition-all hover:bg-white/[0.06] hover:text-white/80"
                >
                  4-Shot Photo
                </Link>
              </nav>
            </div>

            <div className="shrink-0 sm:order-3">
              <SettingsDrawer />
            </div>
          </div>

        </div>
      </header>

      {availableLastGeneratedOutput && !lastGeneratedOutputBannerDismissed && (
        <div className="mx-auto mt-4 w-full max-w-[var(--main-max-width)] px-4 sm:px-6 lg:px-8">
          <div
            data-testid="last-generated-output-banner"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 shadow-[var(--surface-shadow)]"
          >
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">
                Last generated package found
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[color:var(--muted)]">
                Restore the saved package, setup snapshot, publish summary, and section locks from this browser.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => restoreLastGeneratedOutput(availableLastGeneratedOutput)}
                className="rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-cyan-700 transition hover:bg-cyan-500/20 active:scale-95 dark:text-cyan-100"
              >
                Restore
              </button>
              <button
                type="button"
                onClick={() => setLastGeneratedOutputBannerDismissed(true)}
                className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-4 py-2 text-xs font-black uppercase tracking-[0.08em] text-[color:var(--muted)] transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text)] active:scale-95"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          BUILD TAB
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "build" && (
        <div className="overflow-x-hidden bg-[#050806] text-[#f7f1df]">
          <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_16%_8%,rgba(52,96,61,0.3),transparent_30%),radial-gradient(circle_at_86%_0%,rgba(217,169,79,0.12),transparent_28%),linear-gradient(135deg,#050806_0%,#09120d_44%,#111609_100%)]" />
          <div className="mx-auto w-full max-w-none px-2 py-5 sm:px-4 sm:py-7 lg:px-3 xl:px-4 2xl:px-5">
            <div className="sticky top-0 z-30 mb-3 rounded-[22px] border border-[#d9a94f]/20 bg-[#071009]/94 p-3 shadow-[0_18px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl">
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[820px] xl:grid-cols-4 2xl:min-w-[900px]">
                  {[
                    ["Animal Pair", currentGenerateSubjectPairLabel],
                    ["Story Mode", storyMode.replace(/_/g, " ")],
                    ["Habitat", `${habitatRegion.replace(/_/g, " ")} · ${season.replace(/_/g, " ")}`],
                    ["Model / Provider", `${selectedVideoModelId} · ${activeProvider}`],
                  ].map(([label, value]) => (
                    <div key={label} className="min-w-0 rounded-2xl border border-[#263820] bg-[#050806]/72 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9da892]">{label}</p>
                      <p className="mt-1 truncate text-sm font-black text-[#f7f1df]">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
                  <Link
                    key={compactStoryboardLinkMetadata.key}
                    href={currentStoryboardHref}
                    onClick={saveStoryboardHandoff}
                    aria-label={compactStoryboardLinkMetadata.ariaLabel}
                    title={compactStoryboardLinkMetadata.title}
                    className="inline-flex min-h-10 items-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-black text-cyan-100 transition hover:border-cyan-300/70 hover:bg-cyan-500/15"
                  >
                    Storyboard
                  </Link>
                  <Link
                    href={currentFourShotPhotoHref}
                    onClick={saveFourShotPhotoHandoff}
                    aria-label="Open 4-Shot Photo for the current Build setup"
                    title={currentFourShotPhotoHref}
                    className="inline-flex min-h-10 items-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-black text-cyan-100 transition hover:border-cyan-300/70 hover:bg-cyan-500/15"
                  >
                    4-Shot Photo
                  </Link>
                  <Link
                    href="/image"
                    aria-label="Open Image Studio"
                    className="inline-flex min-h-10 items-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-black text-cyan-100 transition hover:border-cyan-300/70 hover:bg-cyan-500/15"
                  >
                    Image Studio
                  </Link>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    aria-label="Generate the current Wild Stories TV package"
                    className="inline-flex min-h-10 items-center rounded-2xl border border-[#d9a94f]/50 bg-[#d9a94f] px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#151006] shadow-[0_16px_40px_rgba(217,169,79,0.22)] transition hover:bg-[#f3c766] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGenerating ? "Generating..." : "Generate"}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-2 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start xl:grid-cols-[188px_minmax(0,1fr)] xl:gap-3 min-[1900px]:grid-cols-[205px_minmax(0,1fr)_270px]">
              <aside className="hidden space-y-3 lg:sticky lg:top-[92px] lg:block">
                <StudioPanel className="p-3" variant="muted">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d9a94f]">Studio navigation</p>
                  <div className="mt-3 space-y-3">
                    <div className="rounded-2xl border border-[#263820] bg-[#071009] p-2.5">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9da892]">Production Steps</p>
                      <div role="group" aria-label="Build steps" className="mt-2 grid gap-1.5">
                        {([
                          { step: 1 as Step, label: "Step 1", title: "Wildlife Setup" },
                          { step: 2 as Step, label: "Step 2", title: "Engine & Quality" },
                          { step: 3 as Step, label: "Step 3", title: "Generate" },
                        ]).map((s) => {
                          const state = step === s.step ? "active" : step > s.step ? "done" : "idle";
                          return (
                            <button
                              key={s.step}
                              type="button"
                              onClick={() => setStep(s.step)}
                              aria-current={step === s.step ? "step" : undefined}
                              className={[
                                "group flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition active:scale-[0.98]",
                                state === "active"
                                  ? "border-[#d9a94f]/60 bg-[#d9a94f]/18 text-[#f7f1df]"
                                  : state === "done"
                                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                                    : "border-[#263820] bg-[#050806]/55 text-[#c9d2bd] hover:border-[#d9a94f]/35 hover:text-[#f7f1df]",
                              ].join(" ")}
                            >
                              <span className={[
                                "grid h-6 w-6 shrink-0 place-items-center rounded-lg text-[10px] font-black",
                                state === "active"
                                  ? "bg-[#d9a94f] text-[#151006]"
                                  : state === "done"
                                    ? "bg-emerald-400/18 text-emerald-100"
                                    : "bg-white/5 text-[#9da892] group-hover:text-[#f3c766]",
                              ].join(" ")}
                              >
                                {state === "done" ? "✓" : s.step}
                              </span>
                              <span className="min-w-0">
                                <span className="block text-[9px] font-black uppercase tracking-[0.14em] opacity-70">{s.label}</span>
                                <span className="block truncate text-xs font-black">{s.title}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#263820] bg-[#071009] p-2.5">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9da892]">Routes</p>
                      <div className="mt-2 grid gap-1.5">
                        <Link
                          key={compactStoryboardLinkMetadata.key}
                          href={currentStoryboardHref}
                          onClick={saveStoryboardHandoff}
                          aria-label={compactStoryboardLinkMetadata.ariaLabel}
                          title={compactStoryboardLinkMetadata.title}
                          className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:border-cyan-300/70 hover:bg-cyan-500/15"
                        >
                          Storyboard
                        </Link>
                        <Link
                          href={currentFourShotPhotoHref}
                          onClick={saveFourShotPhotoHandoff}
                          title={currentFourShotPhotoHref}
                          className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:border-cyan-300/70 hover:bg-cyan-500/15"
                        >
                          4-Shot Photo
                        </Link>
                        <Link
                          href="/image"
                          className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-xs font-black text-cyan-100 transition hover:border-cyan-300/70 hover:bg-cyan-500/15"
                        >
                          Image Studio
                        </Link>
                        <button
                          type="button"
                          onClick={() => setActiveTab("workflows")}
                          aria-label="Open Workflows tab"
                          className="rounded-xl border border-[#d9a94f]/25 bg-[#d9a94f]/10 px-3 py-2 text-left text-xs font-black text-[#f3c766] transition hover:border-[#d9a94f]/70 hover:bg-[#d9a94f]/18"
                        >
                          Workflows
                        </button>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#263820] bg-[#071009] p-2.5">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9da892]">Presets</p>
                      <div className="mt-2 grid gap-1.5 text-xs">
                        {[
                          ["USA Story Presets", "Step 1"],
                          ["My Workflow Presets", `${myWorkflowPresets.length} saved`],
                          ["Preset Packs", `${workflowPresetControls.presetPacks.length} packs`],
                        ].map(([label, value]) => (
                          <div key={label} className="flex items-center justify-between gap-2 rounded-xl border border-[#263820] bg-[#050806]/55 px-2.5 py-2">
                            <span className="font-bold text-[#dce8d1]">{label}</span>
                            <span className="shrink-0 text-[10px] font-black uppercase tracking-[0.12em] text-[#9da892]">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#263820] bg-[#071009] p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9da892]">Post-Production</p>
                        <span className="rounded-full border border-[#314428] bg-[#050806]/70 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#9da892]">Status</span>
                      </div>
                      <div className="mt-2 grid gap-1.5 text-xs">
                        {[
                          {
                            label: "Fix Center",
                            value: setupFixFeedback ? "Fix noted" : pkg ? "Review" : "Waiting",
                            detail: setupFixFeedback ? "Last setup fix available" : "Prompt repair and cleanup live in Step 3",
                            tone: setupFixFeedback || pkg ? "gold" : "idle",
                          },
                          {
                            label: "QA History",
                            value: String(creatorQaRuns.length) + " runs",
                            detail: creatorQaRuns.length ? "Creator QA trail captured" : "Runs appear after generation",
                            tone: creatorQaRuns.length ? "green" : "idle",
                          },
                          {
                            label: "Library",
                            value: pinnedOutput ? "Pinned" : availableLastGeneratedOutput ? "Last output" : String(myWorkflowPresets.length) + " presets",
                            detail: pinnedOutput ? "Pinned package ready to restore" : "Local presets and restore state only",
                            tone: pinnedOutput || availableLastGeneratedOutput ? "cyan" : "idle",
                          },
                          {
                            label: "Social Package",
                            value: pkg?.hashtags ? String(pkg.hashtags.split(/\s+/).filter(Boolean).length) + " tags" : "Waiting",
                            detail: pkg?.caption ? "Caption and hashtags ready" : "Facebook copy generated in Step 3",
                            tone: pkg?.caption && pkg?.hashtags ? "green" : "idle",
                          },
                          {
                            label: "Export",
                            value: pkg ? "Ready" : "Waiting",
                            detail: pkg ? "Use Step 3 copy/TXT/JSON controls" : "No generated package yet",
                            tone: pkg ? "gold" : "idle",
                          },
                        ].map((item) => (
                          <div key={item.label} className="rounded-xl border border-[#263820] bg-[#050806]/55 px-2.5 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-[#dce8d1]">{item.label}</span>
                              <span className={[
                                "shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em]",
                                item.tone === "green"
                                  ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-100"
                                  : item.tone === "gold"
                                    ? "border-[#d9a94f]/35 bg-[#d9a94f]/12 text-[#f3c766]"
                                    : item.tone === "cyan"
                                      ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-100"
                                      : "border-[#314428] bg-[#071009] text-[#9da892]",
                              ].join(" ")}
                              >
                                {item.value}
                              </span>
                            </div>
                            <p className="mt-1 text-[10px] leading-4 text-[#9da892]">{item.detail}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </StudioPanel>

                <StudioPanel className="p-3" variant="muted">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d9a94f]">Current setup</p>
                  <h2 className="mt-2 text-base font-semibold leading-snug text-white">{currentGenerateSubjectPairLabel}</h2>
                  <div className="mt-3 grid gap-1.5 text-xs">
                    {[
                      ["Mode", storyMode.replace(/_/g, " ")],
                      ["Habitat", habitatRegion.replace(/_/g, " ")],
                      ["Season", season.replace(/_/g, " ")],
                      ["Time", timeOfDay.replace(/_/g, " ")],
                      ["Output", durationLane + " reel"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-[#263820] bg-[#071009] p-2.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9da892]">{label}</p>
                        <p className="mt-1 font-semibold text-[#f7f1df]">{value}</p>
                      </div>
                    ))}
                  </div>
                </StudioPanel>

                <StudioPanel className="p-3" variant="muted">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d9a94f]">Provider status</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#263820] bg-[#071009] px-3 py-2">
                      <span className="text-xs font-semibold text-[#dce8d1]">{activeProvider === "gemini" ? "Gemini Default" : activeProvider}</span>
                      <StudioStatusPill tone="green">Selected</StudioStatusPill>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#4b3816] bg-[#1a1307] px-3 py-2">
                      <span className="text-xs font-semibold text-[#dce8d1]">Fallback</span>
                      <StudioStatusPill tone={autoFallback ? "gold" : "muted"}>{autoFallback ? "On" : "Off"}</StudioStatusPill>
                    </div>
                  </div>
                </StudioPanel>

              </aside>

              <section className="min-w-0 space-y-4">
                <StudioPanel className="relative overflow-hidden p-4 sm:p-5" variant="default">
                  <div className="absolute inset-0">
                    <Image
                      src="/brand-assets/clean/hero-wide-wild-stories-tv-no-text.png"
                      alt="Clean Wild Stories TV wide hero background"
                      fill
                      sizes="100vw"
                      className="hidden object-cover object-center opacity-80 sm:block"
                      priority
                    />
                    <Image
                      src="/brand-assets/clean/mobile-hero-no-text.png"
                      alt="Clean Wild Stories TV mobile hero background"
                      fill
                      sizes="100vw"
                      className="object-cover object-center opacity-72 sm:hidden"
                      priority
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,6,0.86)_0%,rgba(5,8,6,0.68)_44%,rgba(5,8,6,0.48)_100%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(217,169,79,0.18),transparent_34%),linear-gradient(0deg,rgba(5,8,6,0.76),rgba(5,8,6,0.18)_48%,rgba(5,8,6,0.72))]" />
                  </div>
                  <div className="relative z-10">
                    <StudioSectionHeader
                      eyebrow="Build command center"
                      title="Wildlife reel setup workspace"
                      description="Build setup, tune engine quality, generate the prompt package, and hand off the current setup to Storyboard or Four-Shot Photo without changing the existing Step logic."
                      badges={
                        <>
                          <StudioStatusPill tone="gold">Step {step}</StudioStatusPill>
                          <StudioStatusPill tone="green">Layout only</StudioStatusPill>
                          <StudioStatusPill tone="cyan">Handoffs preserved</StudioStatusPill>
                        </>
                      }
                    />
                  </div>
                </StudioPanel>

                <div className="space-y-3">
                  <section className={[
                    "overflow-hidden rounded-[28px] border shadow-[0_18px_70px_rgba(0,0,0,0.24)] transition",
                    step === 1
                      ? "border-[#d9a94f]/45 bg-[#071009]/92"
                      : "border-[#263820] bg-[#071009]/58 hover:border-[#d9a94f]/25",
                  ].join(" ")}
                  >
                    <button
                      type="button"
                      aria-current={step === 1 ? "step" : undefined}
                      aria-expanded={step === 1}
                      aria-label="Step 1 Wildlife Setup"
                      onClick={() => setStep(1)}
                      className="flex w-full flex-col gap-3 p-4 text-left transition sm:flex-row sm:items-center sm:justify-between sm:p-5"
                    >
                      <span className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">Step 1 Command Deck</span>
                        <span className="mt-1 block text-xl font-black text-[#f7f1df]">Wildlife Setup</span>
                        <span className="mt-1 block text-sm leading-6 text-[#c9d2bd]">Animal pair, story direction, habitat, presets, scene fit, and safe handoffs.</span>
                      </span>
                      <span className="flex shrink-0 flex-wrap items-center gap-2">
                        <StudioStatusPill tone={step === 1 ? "gold" : step > 1 ? "green" : "muted"}>{step === 1 ? "Active" : step > 1 ? "Done" : "Idle"}</StudioStatusPill>
                        <span className="rounded-full border border-[#263820] bg-[#050806]/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#9da892]">Open</span>
                      </span>
                    </button>

                    {step === 1 && (
                      <div className="step-one-production-canvas border-t border-[#263820] bg-[#050806]/34 p-2 sm:p-3">
                        <style>{`
                          @media (min-width: 1280px) and (max-width: 1899px) {
                            .step-one-production-canvas > div > div:nth-child(2) {
                              grid-template-columns: minmax(0, 1fr) !important;
                            }

                            .step-one-production-canvas > div > div:nth-child(2) > div:last-child {
                              display: grid;
                              grid-template-columns: repeat(2, minmax(0, 1fr));
                              gap: 1rem;
                            }

                            .step-one-production-canvas > div > div:nth-child(2) > div:last-child > * {
                              min-width: 0;
                            }
                          }
                        `}</style>
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
                fourShotPhotoHref={currentFourShotPhotoHref}
                currentSetupLabel={currentGenerateCtaLabel}
                onOpenStoryboardWorkflow={openStoryboardWorkflow}
                onOpenFourShotPhotoWorkflow={openFourShotPhotoWorkflow}
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
                onResetStoryModeSubjectDefaults={handleResetStoryModeSubjectDefaults}
                onApplyRecommendedSeasonalSetup={handleApplyRecommendedSeasonalSetup}
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
                onApplyRankedStoryModeSetup={handleApplyRankedStoryModeSetup}
                onApplyStorySetupTuner={handleApplyStorySetupTuner}
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
                myWorkflowPresets={myWorkflowPresets}
                suggestedMyWorkflowPresetName={suggestedMyWorkflowPresetName}
                myWorkflowPresetStatus={myWorkflowPresetStatus}
                myWorkflowPresetStorageWarning={myWorkflowPresetStorageWarning}
                onSaveMyWorkflowPreset={handleSaveMyWorkflowPreset}
                onApplyMyWorkflowPreset={handleApplyMyWorkflowPreset}
                onRenameMyWorkflowPreset={handleRenameMyWorkflowPreset}
                onDeleteMyWorkflowPreset={handleDeleteMyWorkflowPreset}
                onOpenCustomAnimal={() =>
                  openCustomAnimalModal({
                    defaultArc: arc,
                    driftRisk: preset.driftRisk,
                  })
                }
                        />
                      </div>
                    )}
                  </section>

                  <section className={[
                    "overflow-hidden rounded-[28px] border shadow-[0_18px_70px_rgba(0,0,0,0.24)] transition",
                    step === 2
                      ? "border-[#d9a94f]/45 bg-[#071009]/92"
                      : "border-[#263820] bg-[#071009]/58 hover:border-[#d9a94f]/25",
                  ].join(" ")}
                  >
                    <button
                      type="button"
                      aria-current={step === 2 ? "step" : undefined}
                      aria-expanded={step === 2}
                      aria-label="Step 2 Engine & Quality"
                      onClick={() => setStep(2)}
                      className="flex w-full flex-col gap-3 p-4 text-left transition sm:flex-row sm:items-center sm:justify-between sm:p-5"
                    >
                      <span className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">Step 2 Engine Bay</span>
                        <span className="mt-1 block text-xl font-black text-[#f7f1df]">Engine & Quality</span>
                        <span className="mt-1 block text-sm leading-6 text-[#c9d2bd]">Provider/model selection, video capability, quality locks, media analysis, and scene notes.</span>
                      </span>
                      <span className="flex shrink-0 flex-wrap items-center gap-2">
                        <StudioStatusPill tone={step === 2 ? "gold" : step > 2 ? "green" : "muted"}>{step === 2 ? "Active" : step > 2 ? "Done" : "Idle"}</StudioStatusPill>
                        <span className="rounded-full border border-[#263820] bg-[#050806]/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#9da892]">Open</span>
                      </span>
                    </button>

                    {step === 2 && (
                      <div className="border-t border-[#263820] bg-[#050806]/34 p-2 sm:p-3">
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
                selectedVideoModelId={selectedVideoModelId}
                selectedVideoProviderGroup={selectedVideoProviderGroup}
                autoSelectRecommendedVideoModel={autoSelectRecommendedVideoModel}
                onVideoModelSelectionChange={handleVideoModelSelectionChange}
                onAutoSelectRecommendedVideoModelChange={
                  setAutoSelectRecommendedVideoModel
                }
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
                      </div>
                    )}
                  </section>

                  <section className={[
                    "overflow-hidden rounded-[28px] border shadow-[0_18px_70px_rgba(0,0,0,0.24)] transition",
                    step === 3
                      ? "border-[#d9a94f]/45 bg-[#071009]/92"
                      : "border-[#263820] bg-[#071009]/58 hover:border-[#d9a94f]/25",
                  ].join(" ")}
                  >
                    <button
                      type="button"
                      aria-current={step === 3 ? "step" : undefined}
                      aria-expanded={step === 3}
                      aria-label="Step 3 Generate"
                      onClick={() => setStep(3)}
                      className="flex w-full flex-col gap-3 p-4 text-left transition sm:flex-row sm:items-center sm:justify-between sm:p-5"
                    >
                      <span className="min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">Step 3 Output Bench</span>
                        <span className="mt-1 block text-xl font-black text-[#f7f1df]">Generate & Locks</span>
                        <span className="mt-1 block text-sm leading-6 text-[#c9d2bd]">Provider readiness, generation, package locks, versions, QA history, output, copy, and export.</span>
                      </span>
                      <span className="flex shrink-0 flex-wrap items-center gap-2">
                        <StudioStatusPill tone={step === 3 ? "gold" : "muted"}>{step === 3 ? "Active" : pkg ? "Ready" : "Idle"}</StudioStatusPill>
                        <span className="rounded-full border border-[#263820] bg-[#050806]/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#9da892]">Open</span>
                      </span>
                    </button>

                    {step === 3 && (
                      <div className="border-t border-[#263820] bg-[#050806]/34 p-2 sm:p-3">
                        <Step3Generate
                predator={predator}
                prey={prey}
                storyMode={storyMode}
                subjectA={currentStorySubjectSnapshot.subjectA}
                subjectB={currentStorySubjectSnapshot.subjectB}
                subjectPairLabel={currentGenerateSubjectPairLabel}
                generateCtaLabel={currentGenerateCtaLabel}
                contentLane={contentLane}
                habitatRegion={habitatRegion}
                season={season}
                timeOfDay={timeOfDay}
                animalOptions={predatorOptions}
                violenceLevel={violenceLevel}
                actionStyle={actionStyle}
                runwayModel={runwayModel}
                klingModel={klingModel}
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
                onApplySetupFixAction={handleApplySetupFixAction}
                onApplyCleanScenePrompt={handleSceneDescriptionChange}
                onOpenQaTarget={handleOpenQaTarget}
                setupFixFeedback={setupFixFeedback}
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
                      </div>
                    )}
                  </section>
                </div>
              </section>

              <aside className="space-y-3 lg:col-span-2 min-[1900px]:col-span-1 min-[1900px]:sticky min-[1900px]:top-[92px]">
                <StudioPanel className="p-3" variant="default">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">Output Studio</p>
                      <p className="mt-1 text-xs leading-5 text-[#c9d2bd]">Quick production map. Full copy/export controls remain inside Step 3.</p>
                    </div>
                    <StudioStatusPill tone={pkg ? "green" : "muted"}>{pkg ? "Package ready" : "Waiting"}</StudioStatusPill>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-2xl border border-[#263820] bg-[#050806]/72 px-3 py-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#9da892]">Provider</p>
                      <p className="mt-1 truncate font-black text-[#f7f1df]">{activeProvider === "gemini" ? "Gemini" : activeProvider}</p>
                    </div>
                    <div className="rounded-2xl border border-[#263820] bg-[#050806]/72 px-3 py-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#9da892]">Fallback</p>
                      <p className="mt-1 truncate font-black text-[#f7f1df]">{autoFallback ? "Auto on" : "Manual"}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {[
                      {
                        label: "Master Image",
                        value: pkg?.imagePrompt ? "Ready" : "Pending",
                        detail: pkg?.gptImage2Prompt ? "GPT Image 2 + master" : pkg?.imagePrompt ? "Master prompt" : "Generate package first",
                        tone: pkg?.imagePrompt ? "ready" : "idle",
                      },
                      {
                        label: "Storyboard",
                        value: pkg?.shotImagePlan?.length ? String(pkg.shotImagePlan.length) + " frames" : "Pending",
                        detail: pkg?.shotImagePlan?.length ? "Clean frame plan available" : "Storyboard prompt waits for output",
                        tone: pkg?.shotImagePlan?.length ? "ready" : "idle",
                      },
                      {
                        label: "Kling",
                        value: pkg?.klingShots?.length ? String(pkg.klingShots.length) + " shots" : "Pending",
                        detail: pkg?.klingNative15s ? "15s native prompt included" : "Motion prompt status",
                        tone: pkg?.klingShots?.length ? "ready" : "idle",
                      },
                      {
                        label: "Seedance",
                        value: pkg?.seedanceShots?.length ? String(pkg.seedanceShots.length) + " shots" : "Pending",
                        detail: pkg?.seedanceMultiShotPrompt ? "Multi-shot prompt included" : "Sequence prompt status",
                        tone: pkg?.seedanceShots?.length ? "ready" : "idle",
                      },
                      {
                        label: "Runway Fix",
                        value: pkg?.runwayShots?.length ? String(pkg.runwayShots.length) + " refs" : "Pending",
                        detail: pkg?.runwayWorkflowPack ? "Workflow pack available" : "I2V / repair path status",
                        tone: pkg?.runwayShots?.length ? "ready" : "idle",
                      },
                      {
                        label: "Caption + Hashtags",
                        value: pkg?.hashtags ? String(pkg.hashtags.split(/\s+/).filter(Boolean).length) + " tags" : "Pending",
                        detail: pkg?.caption ? "Caption ready" : "Facebook copy waits for output",
                        tone: pkg?.caption && pkg?.hashtags ? "ready" : "idle",
                      },
                      {
                        label: "CapCut Edit",
                        value: pkg?.capCutPlan ? "Ready" : "Pending",
                        detail: pkg?.capCutScript ? "Script + edit guide" : "Edit plan status",
                        tone: pkg?.capCutPlan ? "ready" : "idle",
                      },
                      {
                        label: "Export",
                        value: pkg ? "Step 3" : "Pending",
                        detail: pkg ? "Copy/TXT/JSON controls in Step 3" : "No package yet",
                        tone: pkg ? "ready" : "idle",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={[
                          "rounded-2xl border px-3 py-2.5 transition",
                          item.tone === "ready"
                            ? "border-emerald-400/25 bg-emerald-500/8"
                            : "border-[#263820] bg-[#071009]",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-black text-[#dce8d1]">{item.label}</span>
                          <span className={[
                            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]",
                            item.tone === "ready"
                              ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-100"
                              : "border-[#314428] bg-[#050806]/70 text-[#9da892]",
                          ].join(" ")}
                          >
                            {item.value}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-4 text-[#9da892]">{item.detail}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-[#d9a94f]/25 bg-[#1d1607]/45 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#f3c766]">Copy / Export</p>
                        <p className="mt-1 text-[11px] leading-4 text-[#c9d2bd]">Use the existing Step 3 output workbench so copy/export behavior stays unchanged.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        aria-label="Open Step 3 output workbench for copy and export controls"
                        className="rounded-xl border border-[#d9a94f]/40 bg-[#d9a94f]/14 px-3 py-2 text-[11px] font-black text-[#f3c766] transition hover:border-[#d9a94f]/70 hover:bg-[#d9a94f]/20"
                      >
                        Open Step 3
                      </button>
                    </div>
                  </div>
                </StudioPanel>

                <StudioPanel className="p-4" variant="muted">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">Readiness</p>
                  <div className="mt-3 space-y-2">
                    {[
                      ["Setup", "Active"],
                      ["Quality", qualityReco.level],
                      ["Package", pkg ? "Generated" : "Waiting"],
                      ["Locks", Object.values(packageLocks).filter(Boolean).length + " active"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-3 rounded-2xl border border-[#263820] bg-[#071009] px-3 py-2 text-xs">
                        <span className="font-semibold text-[#9da892]">{label}</span>
                        <span className="font-black text-[#f7f1df]">{value}</span>
                      </div>
                    ))}
                  </div>
                </StudioPanel>

                <StudioPanel className="p-4" variant="muted">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">Post-Production Pulse</p>
                      <p className="mt-1 text-xs leading-5 text-[#c9d2bd]">Status-only summary for fixes, QA, library, social packaging, and export readiness.</p>
                    </div>
                    <StudioStatusPill tone={pkg ? "gold" : "muted"}>{pkg ? "Review ready" : "Awaiting output"}</StudioStatusPill>
                  </div>
                  <div className="mt-4 grid gap-2 text-xs">
                    {[
                      {
                        label: "Fix Center",
                        value: setupFixFeedback ? "Fix feedback" : pkg ? "Available" : "Waiting",
                        detail: setupFixFeedback || "Open Step 3 for targeted prompt repair and setup cleanup.",
                        tone: setupFixFeedback || pkg ? "gold" : "idle",
                      },
                      {
                        label: "QA History",
                        value: String(creatorQaRuns.length) + " runs",
                        detail: creatorQaRuns.length ? "Latest QA run is stored in the current browser session." : "QA runs record after package generation.",
                        tone: creatorQaRuns.length ? "green" : "idle",
                      },
                      {
                        label: "Library",
                        value: pinnedOutput ? "Pinned output" : availableLastGeneratedOutput ? "Restore ready" : "Local only",
                        detail: pinnedOutput ? "Pinned package can be restored from Step 3." : "Workflow presets and last-output restore stay unchanged.",
                        tone: pinnedOutput || availableLastGeneratedOutput ? "cyan" : "idle",
                      },
                      {
                        label: "Social Package",
                        value: publishFlowSummary?.publishWorthy ? "Publish worthy" : pkg?.caption ? "Draft ready" : "Waiting",
                        detail: pkg?.caption ? "Caption, CTA, and Facebook hashtag package are in Step 3." : "Generated package will populate social copy.",
                        tone: publishFlowSummary?.publishWorthy || pkg?.caption ? "green" : "idle",
                      },
                      {
                        label: "Export Readiness",
                        value: pkg ? "Copy/export ready" : "Pending",
                        detail: pkg ? "Existing copy, TXT, and JSON actions remain inside Step 3." : "Export unlocks after generation.",
                        tone: pkg ? "gold" : "idle",
                      },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-[#263820] bg-[#071009] px-3 py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-black text-[#dce8d1]">{item.label}</span>
                          <span className={[
                            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em]",
                            item.tone === "green"
                              ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-100"
                              : item.tone === "gold"
                                ? "border-[#d9a94f]/35 bg-[#d9a94f]/12 text-[#f3c766]"
                                : item.tone === "cyan"
                                  ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-100"
                                  : "border-[#314428] bg-[#050806]/70 text-[#9da892]",
                          ].join(" ")}
                          >
                            {item.value}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] leading-4 text-[#9da892]">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </StudioPanel>

                <StudioPanel className="overflow-hidden p-4" variant="muted">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#d9a94f]">Brand Preview</p>
                      <p className="mt-1 text-xs leading-5 text-[#c9d2bd]">Cover and creator identity previews only. No images sit behind live controls.</p>
                    </div>
                    <Link
                      href="/studio-full-preview"
                      className="rounded-full border border-[#d9a94f]/35 bg-[#d9a94f]/12 px-3 py-1.5 text-[11px] font-black text-[#f3c766] transition hover:border-[#d9a94f]/70 hover:bg-[#d9a94f]/18"
                    >
                      View Brand Assets
                    </Link>
                  </div>

                  <div className="mt-4 grid gap-3">
                    <div className="overflow-hidden rounded-2xl border border-[#314428] bg-[#071009] shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
                      <div className="relative aspect-[16/7] w-full">
                        <Image
                          src="/brand-assets/clean/build-hero-wildlife-creator-no-text.png"
                          alt="Clean Build command center brand preview"
                          fill
                          sizes="(min-width: 1536px) 300px, 100vw"
                          className="object-cover"
                          priority={false}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050806]/45 via-transparent to-transparent" />
                      </div>
                      <div className="border-t border-[#263820] px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#d9a94f]">Build Mood</p>
                        <p className="mt-0.5 text-xs font-semibold text-[#f7f1df]">Clean command-center art</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-[82px_minmax(0,1fr)] gap-3 rounded-2xl border border-[#263820] bg-[#071009] p-3">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-[#314428] bg-[#101a10]">
                        <Image
                          src="/brand-assets/clean/creator-profile-no-text.png"
                          alt="Clean Wild Stories TV creator identity preview"
                          fill
                          sizes="82px"
                          className="object-cover object-[50%_18%]"
                        />
                      </div>
                      <div className="min-w-0 self-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#d9a94f]">Creator Identity</p>
                        <p className="mt-1 text-sm font-semibold text-[#f7f1df]">Clean creator portrait</p>
                        <p className="mt-1 text-xs leading-5 text-[#c9d2bd]">No baked-in text; safe as a small identity preview with card framing.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-[minmax(0,1fr)_82px] gap-3 rounded-2xl border border-[#263820] bg-[#071009] p-3">
                      <div className="min-w-0 self-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#d9a94f]">Clean Wide Hero</p>
                        <p className="mt-1 text-xs leading-5 text-[#c9d2bd]">No-text wide asset, shown as a small overlay-safe reference tile.</p>
                      </div>
                      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[#314428] bg-[#101a10]">
                        <Image
                          src="/brand-assets/clean/hero-wide-wild-stories-tv-no-text.png"
                          alt="Clean wide Wild Stories TV hero preview tile"
                          fill
                          sizes="82px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                </StudioPanel>
              </aside>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          WORKFLOWS TAB — scoped dark zone
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "workflows" && (
        <div className="min-h-[calc(100vh-56px)] overflow-x-hidden bg-[#050806] text-[#f7f1df]">
          <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_14%_12%,rgba(52,96,61,0.32),transparent_30%),radial-gradient(circle_at_86%_4%,rgba(217,169,79,0.14),transparent_28%),linear-gradient(135deg,#050806_0%,#09120d_44%,#111609_100%)]" />
          <div className="w-full px-4 py-5 sm:px-6 sm:py-7 lg:px-8 xl:px-10 2xl:px-12">
            <div className="mx-auto max-w-[1880px] space-y-4">
              <StudioPanel className="p-4 sm:p-5" variant="default">
                <StudioSectionHeader
                  eyebrow="Production workflow viewer"
                  title="Wild Stories TV workflow maps"
                  description="Full-width production diagram viewer for the real WSTV custom workflow and the Runway official reference workflow. State and diagram behavior stay owned by the existing workflowTab and setWorkflowTab logic."
                  badges={
                    <>
                      <StudioStatusPill tone="green">Production reused</StudioStatusPill>
                      <StudioStatusPill tone="gold">Preview-approved style</StudioStatusPill>
                      <StudioStatusPill tone="muted">Layout only</StudioStatusPill>
                    </>
                  }
                />
                <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.42fr)] xl:items-end">
                  <StudioActionBar>
                    {[
                      "Canonical Anchor",
                      "Extract Frame Handoff",
                      "Last Frame Fallback",
                      "First Frame QA",
                      "Audio Layering",
                      "Social Side Outputs",
                    ].map((item) => (
                      <StudioStatusPill key={item} tone="default">{item}</StudioStatusPill>
                    ))}
                  </StudioActionBar>
                  <StudioTabs
                    tabs={[
                      {
                        id: "wstv" as WorkflowTab,
                        label: "WSTV Custom Workflow",
                        description: "Production continuity map",
                        badge: "Primary",
                      },
                      {
                        id: "runway" as WorkflowTab,
                        label: "Runway Official Workflow",
                        description: "Native safe-handoff reference",
                        badge: "Reference",
                      },
                    ]}
                    activeId={workflowTab}
                    onChange={setWorkflowTab}
                  />
                </div>
              </StudioPanel>

              <StudioDiagramFrame
                eyebrow="Premium diagram frame"
                title={workflowTab === "wstv"
                  ? "WSTV · 4-shot production workflow · hybrid primary lane"
                  : "Runway Official · 4-shot safe handoff · Gen-4.5 native"}
                description={workflowTab === "wstv"
                  ? "Production-oriented continuity viewer for the hybrid 4-shot path, with Canonical Anchor, preferred Extract Frame handoff, Last Frame fallback, First Frame QA, audio layering, and social side outputs."
                  : "Optional reference viewer for the Runway-native safe-handoff pattern, manual overrides, and stitched final assembly."}
              >
                {workflowTab === "wstv" ? <WSTVWorkflowDiagram /> : <RunwayOfficialWorkflowDiagram />}
              </StudioDiagramFrame>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Primary lane", "WSTV custom workflow remains the default production map for the hybrid 4-shot path."],
                  ["Runway reference", "Runway official diagram remains available through the same workflowTab state switch."],
                  ["Mobile safe", "The diagram is framed inside an overflow-safe panel so the page avoids horizontal spill."],
                  ["No logic change", "Only wrapper classes and visual components changed in this production pass."],
                ].map(([title, detail]) => (
                  <StudioPanel key={title} className="p-4" variant="muted">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#d9a94f]">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#c9d2bd]">{detail}</p>
                  </StudioPanel>
                ))}
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
