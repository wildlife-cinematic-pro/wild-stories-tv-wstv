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
import { isCameraAnglePreset } from "@/lib/camera-angle-presets";

import type {
  AIProvider,
  Arc,
  CameraAnglePreset,
  ContentLane,
  DepthMode,
  HabitatPreset,
  KlingModel,
  WildlifeScopeMode,
  RealismMode,
  RunwayModel,
  Weather,
} from "@/types";

type UseBuildPersistenceInput = {
  predator: string;
  prey: string;
  arc: Arc;
  wildlifeScopeMode: WildlifeScopeMode;
  contentLane: ContentLane;
  cameraAnglePreset: CameraAnglePreset;
  weather: Weather;
  depthMode: DepthMode;
  habitat: HabitatPreset;
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
  setArc: Dispatch<SetStateAction<Arc>>;
  setWildlifeScopeMode: Dispatch<SetStateAction<WildlifeScopeMode>>;
  setContentLane: Dispatch<SetStateAction<ContentLane>>;
  setCameraAnglePreset: Dispatch<SetStateAction<CameraAnglePreset>>;
  setWeather: Dispatch<SetStateAction<Weather>>;
  setDepthMode: Dispatch<SetStateAction<DepthMode>>;
  setHabitat: Dispatch<SetStateAction<HabitatPreset>>;
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

export function useBuildPersistence({
  predator,
  prey,
  arc,
  wildlifeScopeMode,
  contentLane,
  cameraAnglePreset,
  weather,
  depthMode,
  habitat,
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
    if (saved?.activeProvider) setActiveProvider(saved.activeProvider);
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
    if (saved?.habitat) setHabitat(saved.habitat);
    if (saved?.wildlifeScopeMode && isWildlifeScopeMode(saved.wildlifeScopeMode)) {
      setWildlifeScopeMode(saved.wildlifeScopeMode);
    }
    if (saved?.contentLane && isContentLane(saved.contentLane)) {
      setContentLane(saved.contentLane);
    }
    if (saved?.cameraAnglePreset && isCameraAnglePreset(saved.cameraAnglePreset)) {
      setCameraAnglePreset(saved.cameraAnglePreset);
    }

    const autoApply = (saved as Record<string, unknown>)?.autoApplyHighDrift;
    if (typeof autoApply === "boolean") setAutoApplyHighDrift(autoApply);
  }, [
    setPredator,
    setPrey,
    setArc,
    setWildlifeScopeMode,
    setContentLane,
    setCameraAnglePreset,
    setWeather,
    setDepthMode,
    setHabitat,
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
      habitat,
      wildlifeScopeMode,
      contentLane,
      cameraAnglePreset,
    });
  }, [
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
