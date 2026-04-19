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

import type {
  AIProvider,
  Arc,
  DepthMode,
  HabitatPreset,
  KlingModel,
  RealismMode,
  RunwayModel,
  Weather,
} from "@/types";

type UseBuildPersistenceInput = {
  predator: string;
  prey: string;
  arc: Arc;
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

    const autoApply = (saved as Record<string, unknown>)?.autoApplyHighDrift;
    if (typeof autoApply === "boolean") setAutoApplyHighDrift(autoApply);
  }, [
    setPredator,
    setPrey,
    setArc,
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
  ]);

  useEffect(() => {
    writeShareState({ predator, prey, arc, weather, depthMode, habitat });
  }, [predator, prey, arc, weather, depthMode, habitat]);
}
