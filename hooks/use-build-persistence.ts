"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

import {
  readSettings,
  readShareState,
  writeSettings,
  writeShareState,
} from "@/lib/storage";
import { KLING_MODELS, RUNWAY_MODELS } from "@/lib/model-specs";
import { isContentLane } from "@/lib/content-lanes";
import { isWildlifeScopeMode } from "@/lib/predator-data";
import { normalizeWildlifeScopeMode } from "@/lib/wildlife-focus";
import { isCameraAnglePreset } from "@/lib/camera-angle-presets";
import { isDurationLane } from "@/lib/duration-lanes";

import type {
  AIProvider,
  Arc,
  EncounterMode,
  EndingMode,
  EscapeDirection,
  CameraAnglePreset,
  ContentLane,
  DurationLane,
  HookFamily,
  DepthMode,
  HabitatPreset,
  HabitatRegion,
  KlingModel,
  OffspringLabel,
  WildlifeScopeMode,
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

type HookMode = HookFamily | "all";

type UseBuildPersistenceInput = {
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
  wildlifeScopeMode: WildlifeScopeMode;
  contentLane: ContentLane;
  cameraAnglePreset: CameraAnglePreset;
  weather: Weather;
  depthMode: DepthMode;
  habitat: HabitatPreset;
  durationLane: DurationLane;
  hookMode: HookMode;
  fastPublishMode: boolean;
  strictOriginalityGuard: boolean;
  activeProvider: AIProvider;
  runwayModel: RunwayModel;
  klingModel: KlingModel;
  realismMode: RealismMode;
  motionOnlyI2V: boolean;
  referenceLock: boolean;
  singleActionRule: boolean;
  microMotion: boolean;
  heroVeo: boolean;
  autoApplyHighDrift: boolean;
  setPredator: Dispatch<SetStateAction<string>>;
  setPrey: Dispatch<SetStateAction<string>>;
  setStoryMode: Dispatch<SetStateAction<StoryMode>>;
  setEncounterMode: Dispatch<SetStateAction<EncounterMode>>;
  setEndingMode: Dispatch<SetStateAction<EndingMode>>;
  setViralLane: Dispatch<SetStateAction<ViralLane>>;
  setViolenceLevel: Dispatch<SetStateAction<ViolenceLevel>>;
  setHabitatRegion: Dispatch<SetStateAction<HabitatRegion>>;
  setSeason: Dispatch<SetStateAction<Season>>;
  setTimeOfDay: Dispatch<SetStateAction<TimeOfDay>>;
  setSubjectA: Dispatch<SetStateAction<string | undefined>>;
  setSubjectB: Dispatch<SetStateAction<string | undefined>>;
  setGroupCount: Dispatch<SetStateAction<number | undefined>>;
  setOffspringLabel: Dispatch<SetStateAction<OffspringLabel>>;
  setStrikeMethod: Dispatch<SetStateAction<StrikeMethod>>;
  setEscapeDirection: Dispatch<SetStateAction<EscapeDirection>>;
  setWeatherHazard: Dispatch<SetStateAction<WeatherHazard>>;
  setRutSeason: Dispatch<SetStateAction<boolean>>;
  setFoodItem: Dispatch<SetStateAction<string | undefined>>;
  setArc: Dispatch<SetStateAction<Arc>>;
  setWildlifeScopeMode: Dispatch<SetStateAction<WildlifeScopeMode>>;
  setContentLane: Dispatch<SetStateAction<ContentLane>>;
  setCameraAnglePreset: Dispatch<SetStateAction<CameraAnglePreset>>;
  setWeather: Dispatch<SetStateAction<Weather>>;
  setDepthMode: Dispatch<SetStateAction<DepthMode>>;
  setHabitat: Dispatch<SetStateAction<HabitatPreset>>;
  setDurationLane: Dispatch<SetStateAction<DurationLane>>;
  setHookMode: Dispatch<SetStateAction<HookMode>>;
  setFastPublishMode: Dispatch<SetStateAction<boolean>>;
  setStrictOriginalityGuard: Dispatch<SetStateAction<boolean>>;
  setActiveProvider: Dispatch<SetStateAction<AIProvider>>;
  setRunwayModel: Dispatch<SetStateAction<RunwayModel>>;
  setKlingModel: Dispatch<SetStateAction<KlingModel>>;
  setRealismMode: Dispatch<SetStateAction<RealismMode>>;
  setMotionOnlyI2V: Dispatch<SetStateAction<boolean>>;
  setReferenceLock: Dispatch<SetStateAction<boolean>>;
  setSingleActionRule: Dispatch<SetStateAction<boolean>>;
  setMicroMotion: Dispatch<SetStateAction<boolean>>;
  setHeroVeo: Dispatch<SetStateAction<boolean>>;
  setAutoApplyHighDrift: Dispatch<SetStateAction<boolean>>;
};

function isHookMode(value: unknown): value is HookMode {
  return (
    value === "all" ||
    value === "danger" ||
    value === "curiosity" ||
    value === "reversal"
  );
}

function isAIProvider(value: unknown): value is AIProvider {
  return (
    value === "none" ||
    value === "gemini" ||
    value === "claude" ||
    value === "openai" ||
    value === "groq" ||
    value === "openrouter" ||
    value === "huggingface"
  );
}

function isStoryMode(value: unknown): value is StoryMode {
  return typeof value === "string" && [
    "PREDATOR_VS_PREY",
    "HERD_DEFENSE",
    "MOTHER_BABY",
    "RIVAL_CLASH",
    "NEAR_MISS",
    "FISHING_STRIKE",
    "WEATHER_SURVIVAL",
    "MIGRATION",
    "SCAVENGER_CONFLICT",
  ].includes(value);
}

function isEncounterMode(value: unknown): value is EncounterMode {
  return typeof value === "string" && [
    "FIRST_CONTACT",
    "PEAK_TENSION",
    "ESCALATION",
    "RESOLUTION",
    "AFTERMATH",
  ].includes(value);
}

function isEndingMode(value: unknown): value is EndingMode {
  return typeof value === "string" && [
    "ESCAPE",
    "STANDOFF",
    "DOMINANT_WIN",
    "UNRESOLVED",
    "PROTECTED_EXIT",
    "SEASONAL_DEPARTURE",
  ].includes(value);
}

function isViralLane(value: unknown): value is ViralLane {
  return typeof value === "string" && [
    "TENSION",
    "TENDERNESS",
    "AWE",
    "POWER",
    "UNDERDOG",
    "SURVIVAL",
    "SPECTACLE",
  ].includes(value);
}

function isHabitatRegion(value: unknown): value is HabitatRegion {
  return typeof value === "string" && [
    "YELLOWSTONE",
    "ALASKA",
    "GREAT_PLAINS",
    "PACIFIC_NORTHWEST",
    "EVERGLADES",
    "ROCKY_MOUNTAINS",
    "APPALACHIA",
    "SOUTHWEST_DESERT",
    "COASTAL_WETLANDS",
  ].includes(value);
}

function isSeason(value: unknown): value is Season {
  return typeof value === "string" && [
    "SPRING",
    "SUMMER",
    "FALL",
    "WINTER",
    "MIGRATION_SEASON",
  ].includes(value);
}

function isTimeOfDay(value: unknown): value is TimeOfDay {
  return typeof value === "string" && [
    "DAWN",
    "GOLDEN_HOUR",
    "MIDDAY",
    "DUSK",
    "BLUE_HOUR",
    "NIGHT",
  ].includes(value);
}

function isViolenceLevel(value: unknown): value is ViolenceLevel {
  return value === 1 || value === 2 || value === 3;
}


function isOffspringLabel(value: unknown): value is OffspringLabel {
  return typeof value === "string" && ["cub", "fawn", "calf", "pup", "kit"].includes(value);
}

function isStrikeMethod(value: unknown): value is StrikeMethod {
  return typeof value === "string" && ["POUNCE", "DIVE", "SWIPE", "CHASE", "AMBUSH"].includes(value);
}

function isEscapeDirection(value: unknown): value is EscapeDirection {
  return typeof value === "string" && ["WATER", "UPHILL", "BRUSH", "OPEN_FIELD"].includes(value);
}

function isWeatherHazard(value: unknown): value is WeatherHazard {
  return typeof value === "string" && ["BLIZZARD", "ICE", "FLOOD", "DROUGHT", "HEAT"].includes(value);
}

function cleanOptionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export function useBuildPersistence({
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
}: UseBuildPersistenceInput) {
  useEffect(() => {
    const shared = readShareState();

    if (shared.predator) setPredator(shared.predator);
    if (shared.prey) setPrey(shared.prey);
    if (shared.arc) setArc(shared.arc as Arc);
    if (shared.contentLane && isContentLane(shared.contentLane)) {
      setContentLane(shared.contentLane);
    }
    if (shared.cameraAnglePreset && isCameraAnglePreset(shared.cameraAnglePreset)) {
      setCameraAnglePreset(shared.cameraAnglePreset);
    }
    if (shared.weather) setWeather(shared.weather);
    if (shared.depthMode) setDepthMode(shared.depthMode);
    if (shared.habitat) setHabitat(shared.habitat);

    const saved = readSettings();
    // Gemini remains the default provider on reload; other providers stay manual/session-only.
    if (isAIProvider(saved?.activeProvider) && saved.activeProvider === "gemini") {
      setActiveProvider(saved.activeProvider);
    }
    if (
      saved?.runwayModel &&
      (RUNWAY_MODELS as readonly string[]).includes(saved.runwayModel)
    ) {
      setRunwayModel(saved.runwayModel);
    }
    if (
      saved?.klingModel &&
      (KLING_MODELS as readonly string[]).includes(saved.klingModel)
    ) {
      setKlingModel(saved.klingModel);
    }
    if (saved?.realismMode) setRealismMode(saved.realismMode);
    if (saved?.motionOnlyI2V !== undefined) setMotionOnlyI2V(saved.motionOnlyI2V);
    if (saved?.referenceLock !== undefined) setReferenceLock(saved.referenceLock);
    if (saved?.singleActionRule !== undefined) {
      setSingleActionRule(saved.singleActionRule);
    }
    if (saved?.microMotion !== undefined) setMicroMotion(saved.microMotion);
    if (saved?.heroVeo !== undefined) setHeroVeo(saved.heroVeo);
    if (isDurationLane(saved?.durationLane)) {
      setDurationLane(saved.durationLane);
    }
    if (isHookMode(saved?.hookMode)) setHookMode(saved.hookMode);
    if (saved?.fastPublishMode !== undefined) setFastPublishMode(saved.fastPublishMode);
    if (saved?.strictOriginalityGuard !== undefined) {
      setStrictOriginalityGuard(saved.strictOriginalityGuard);
    }
    if (saved?.habitat) setHabitat(saved.habitat);
    if (saved?.wildlifeScopeMode && isWildlifeScopeMode(saved.wildlifeScopeMode)) {
      setWildlifeScopeMode(normalizeWildlifeScopeMode(saved.wildlifeScopeMode));
    }
    if (saved?.contentLane && isContentLane(saved.contentLane)) {
      setContentLane(saved.contentLane);
    }
    if (saved?.cameraAnglePreset && isCameraAnglePreset(saved.cameraAnglePreset)) {
      setCameraAnglePreset(saved.cameraAnglePreset);
    }

    if (isStoryMode(saved?.storyMode)) setStoryMode(saved.storyMode);
    if (isEncounterMode(saved?.encounterMode)) setEncounterMode(saved.encounterMode);
    if (isEndingMode(saved?.endingMode)) setEndingMode(saved.endingMode);
    if (isViralLane(saved?.viralLane)) setViralLane(saved.viralLane);
    if (isViolenceLevel(saved?.violenceLevel)) {
      setViolenceLevel(saved.violenceLevel);
    }
    if (isHabitatRegion(saved?.habitatRegion)) {
      setHabitatRegion(saved.habitatRegion);
    }
    if (isSeason(saved?.season)) setSeason(saved.season);
    if (isTimeOfDay(saved?.timeOfDay)) setTimeOfDay(saved.timeOfDay);
    const savedSubjectA = cleanOptionalText(saved?.subjectA);
    if (savedSubjectA) setSubjectA(savedSubjectA);
    const savedSubjectB = cleanOptionalText(saved?.subjectB);
    if (savedSubjectB) setSubjectB(savedSubjectB);
    if (typeof saved?.groupCount === "number") setGroupCount(saved.groupCount);
    if (isOffspringLabel(saved?.offspringLabel)) {
      setOffspringLabel(saved.offspringLabel);
    }
    if (isStrikeMethod(saved?.strikeMethod)) setStrikeMethod(saved.strikeMethod);
    if (isEscapeDirection(saved?.escapeDirection)) {
      setEscapeDirection(saved.escapeDirection);
    }
    if (isWeatherHazard(saved?.weatherHazard)) {
      setWeatherHazard(saved.weatherHazard);
    }
    if (typeof saved?.rutSeason === "boolean") setRutSeason(saved.rutSeason);
    const savedFoodItem = cleanOptionalText(saved?.foodItem);
    if (savedFoodItem) setFoodItem(savedFoodItem);

    const autoApply = (saved as Record<string, unknown>)?.autoApplyHighDrift;
    if (typeof autoApply === "boolean") setAutoApplyHighDrift(autoApply);
  }, [
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
  ]);

  useEffect(() => {
    writeSettings({
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
      durationLane,
      hookMode,
      fastPublishMode,
      strictOriginalityGuard,
      habitat,
      wildlifeScopeMode,
      contentLane,
      cameraAnglePreset,
      storyMode,
      encounterMode,
      endingMode,
      viralLane,
      violenceLevel,
      habitatRegion,
      season,
      timeOfDay,
      subjectA: subjectA?.trim() || undefined,
      subjectB: subjectB?.trim() || undefined,
      ...(groupCount === undefined ? {} : { groupCount }),
      offspringLabel,
      strikeMethod,
      escapeDirection,
      weatherHazard,
      rutSeason,
      foodItem: foodItem?.trim() || undefined,
    });
  }, [
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
    durationLane,
    hookMode,
    fastPublishMode,
    strictOriginalityGuard,
    habitat,
    wildlifeScopeMode,
    contentLane,
    cameraAnglePreset,
  ]);

  useEffect(() => {
    writeShareState({
      predator,
      prey,
      arc,
      weather,
      depthMode,
      habitat,
      contentLane,
      cameraAnglePreset,
    });
  }, [
    predator,
    prey,
    arc,
    weather,
    depthMode,
    habitat,
    contentLane,
    cameraAnglePreset,
  ]);
}
