"use client";

import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";

import {
  buildConceptVariantLab,
  type ConceptVariantLabInput,
} from "@/lib/concept-variant-lab";
import type {
  Arc,
  ConceptVariant,
  ConceptVariantLabWinners,
  DurationLane,
  HabitatPreset,
  HookFamily,
} from "@/types";

type HookMode = HookFamily | "all";
type SceneDescriptionMode = "auto" | "manual";

type UseConceptVariantLabInput = ConceptVariantLabInput & {
  currentHookFamily: HookFamily;
  setArc: Dispatch<SetStateAction<Arc>>;
  setArcOverride: Dispatch<SetStateAction<Arc | null>>;
  setHabitat: Dispatch<SetStateAction<HabitatPreset>>;
  setDurationLane: Dispatch<SetStateAction<DurationLane>>;
  setFastPublishMode: Dispatch<SetStateAction<boolean>>;
  setHookMode: Dispatch<SetStateAction<HookMode>>;
  setSceneDescription: Dispatch<SetStateAction<string>>;
  setSceneDescriptionMode: Dispatch<SetStateAction<SceneDescriptionMode>>;
  setSceneDescriptionTouched: Dispatch<SetStateAction<boolean>>;
  setSceneDescriptionVariant: Dispatch<SetStateAction<number>>;
};

export function useConceptVariantLab({
  currentHookFamily,
  setArc,
  setArcOverride,
  setHabitat,
  setDurationLane,
  setFastPublishMode,
  setHookMode,
  setSceneDescription,
  setSceneDescriptionMode,
  setSceneDescriptionTouched,
  setSceneDescriptionVariant,
  ...input
}: UseConceptVariantLabInput): {
  variants: ConceptVariant[];
  winners: ConceptVariantLabWinners;
  activeVariantId: string | null;
  promoteVariant: (variant: ConceptVariant) => void;
} {
  const lab = useMemo(
    () =>
      buildConceptVariantLab({
        ...input,
        currentHookFamily,
      }),
    [input, currentHookFamily]
  );

  const activeVariantId = useMemo(
    () =>
      lab.variants.find(
        (variant) =>
          variant.arc === input.currentArc &&
          variant.habitat === input.currentHabitat &&
          variant.durationLane === input.durationLane &&
          variant.fastPublishMode === input.fastPublishMode &&
          variant.hookFamily === currentHookFamily
      )?.id ?? null,
    [
      lab.variants,
      input.currentArc,
      input.currentHabitat,
      input.durationLane,
      input.fastPublishMode,
      currentHookFamily,
    ]
  );

  const promoteVariant = useCallback(
    (variant: ConceptVariant) => {
      setArcOverride(variant.arc);
      setArc(variant.arc);
      setHabitat(variant.habitat);
      setDurationLane(variant.durationLane);
      setFastPublishMode(variant.fastPublishMode);
      setHookMode(variant.hookFamily);
      setSceneDescriptionVariant(variant.sceneDescriptionVariant);
      setSceneDescription(variant.sceneDescription);
      setSceneDescriptionMode("auto");
      setSceneDescriptionTouched(false);
    },
    [
      setArcOverride,
      setArc,
      setHabitat,
      setDurationLane,
      setFastPublishMode,
      setHookMode,
      setSceneDescriptionVariant,
      setSceneDescription,
      setSceneDescriptionMode,
      setSceneDescriptionTouched,
    ]
  );

  return {
    variants: lab.variants,
    winners: lab.winners,
    activeVariantId,
    promoteVariant,
  };
}
