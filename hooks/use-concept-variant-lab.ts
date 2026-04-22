"use client";

import { useCallback, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import {
  buildConceptVariantLab,
  type ConceptVariantLabInput,
} from "@/lib/concept-variant-lab";
import { autoCleanupConceptVariantCopy } from "@/lib/publish-cleanup";
import type {
  Arc,
  ConceptVariant,
  ConceptVariantLabWinners,
  ContentLane,
  DurationLane,
  HabitatPreset,
  HookFamily,
} from "@/types";

type HookMode = HookFamily | "all";
type SceneDescriptionMode = "auto" | "manual";

export type PromotedVariantPublishCopyOverride = {
  predator: string;
  prey: string;
  contentLane: ContentLane;
  arc: Arc;
  habitat: HabitatPreset;
  durationLane: DurationLane;
  fastPublishMode: boolean;
  hookFamily: HookFamily;
  hook: string;
  caption: string;
  hashtags: string;
};

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
  setPromotedPublishCopyOverride: Dispatch<
    SetStateAction<PromotedVariantPublishCopyOverride | null>
  >;
};

function buildVariantCleanupKey(
  variant: Pick<
    ConceptVariant,
    | "arc"
    | "habitat"
    | "finalEnvironment"
    | "durationLane"
    | "fastPublishMode"
    | "hookFamily"
    | "sceneDescriptionVariant"
  >,
  input: Pick<
    UseConceptVariantLabInput,
    "predator" | "prey" | "contentLane" | "strictOriginalityGuard"
  >
): string {
  return [
    input.predator,
    input.prey,
    input.contentLane,
    variant.arc,
    variant.habitat,
    variant.finalEnvironment,
    variant.durationLane,
    String(variant.fastPublishMode),
    variant.hookFamily,
    String(variant.sceneDescriptionVariant),
    String(input.strictOriginalityGuard),
  ].join("|");
}

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
  setPromotedPublishCopyOverride,
  ...input
}: UseConceptVariantLabInput): {
  variants: ConceptVariant[];
  winners: ConceptVariantLabWinners;
  activeVariantId: string | null;
  promoteVariant: (variant: ConceptVariant) => void;
  autoCleanupVariant: (variant: ConceptVariant) => void;
} {
  const [cleanedVariants, setCleanedVariants] = useState<Record<string, ConceptVariant>>({});

  const lab = useMemo(
    () =>
      buildConceptVariantLab({
        ...input,
        currentHookFamily,
      }),
    [input, currentHookFamily]
  );

  const variants = useMemo(
    () =>
      lab.variants.map((variant) => {
        const key = buildVariantCleanupKey(variant, input);
        return cleanedVariants[key] ?? variant;
      }),
    [lab.variants, input, cleanedVariants]
  );

  const activeVariantId = useMemo(
    () =>
      variants.find(
        (variant) =>
          variant.arc === input.currentArc &&
          variant.habitat === input.currentHabitat &&
          variant.durationLane === input.durationLane &&
          variant.fastPublishMode === input.fastPublishMode &&
          variant.hookFamily === currentHookFamily
      )?.id ?? null,
    [
      variants,
      input.currentArc,
      input.currentHabitat,
      input.durationLane,
      input.fastPublishMode,
      currentHookFamily,
    ]
  );

  const autoCleanupVariant = useCallback(
    (variant: ConceptVariant) => {
      const cleanedVariant = autoCleanupConceptVariantCopy({
        variant,
        predator: input.predator,
        prey: input.prey,
        contentLane: input.contentLane,
        originalityConfirmed: input.strictOriginalityGuard,
      });
      const key = buildVariantCleanupKey(variant, input);
      setCleanedVariants((current) => ({
        ...current,
        [key]: cleanedVariant,
      }));
    },
    [input]
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
      setPromotedPublishCopyOverride(
        variant.publishCleanup?.applied
          ? {
              predator: input.predator,
              prey: input.prey,
              contentLane: input.contentLane,
              arc: variant.arc,
              habitat: variant.habitat,
              durationLane: variant.durationLane,
              fastPublishMode: variant.fastPublishMode,
              hookFamily: variant.hookFamily,
              hook: variant.primaryHook,
              caption: variant.caption,
              hashtags: variant.hashtags,
            }
          : null
      );
    },
    [
      input.contentLane,
      input.predator,
      input.prey,
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
      setPromotedPublishCopyOverride,
    ]
  );

  return {
    variants,
    winners: lab.winners,
    activeVariantId,
    promoteVariant,
    autoCleanupVariant,
  };
}
