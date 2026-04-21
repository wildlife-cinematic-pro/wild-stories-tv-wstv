import type { CameraAnglePreset } from "@/types";

export const DEFAULT_CAMERA_ANGLE_PRESET: CameraAnglePreset = "Auto";

export const cameraAnglePresetOptions = [
  "Auto",
  "Front full-body",
  "Side profile",
  "Low-angle power",
  "Over-the-shoulder",
  "Overhead",
  "Waterline",
  "Ground-level tension",
] as const satisfies readonly CameraAnglePreset[];

export type CameraAnglePresetDefinition = {
  value: CameraAnglePreset;
  label: string;
  helper: string;
  imageFraming: string;
  runwayFraming: string;
  klingFraming: string;
  lightingContinuity: string;
};

const WATER_COMPATIBLE_HABITAT_MODES = new Set(["aquatic", "shoreline"]);

export function isCameraAnglePreset(value: unknown): value is CameraAnglePreset {
  return (
    typeof value === "string" &&
    (cameraAnglePresetOptions as readonly string[]).includes(value)
  );
}

export const cameraAnglePresetDefinitions: Record<
  CameraAnglePreset,
  CameraAnglePresetDefinition
> = {
  Auto: {
    value: "Auto",
    label: "Auto",
    helper:
      "Use the current WSTV framing defaults: wide, full-body, continuity-safe wildlife readability.",
    imageFraming: "",
    runwayFraming: "",
    klingFraming: "",
    lightingContinuity: "",
  },
  "Front full-body": {
    value: "Front full-body",
    label: "Front full-body",
    helper:
      "Best when both animals need instant species readability and clean full-body scale.",
    imageFraming:
      "Camera angle preset: front full-body wildlife read, both animals squared clearly to camera, full legs visible, clean 9:16 spacing.",
    runwayFraming:
      "Camera preset: frontal full-body read; keep both subjects visible through the move.",
    klingFraming:
      "Camera preset: front full-body framing with both subjects readable and separated.",
    lightingContinuity:
      "Keep the same frontal light direction and readable rim separation across all continuity images.",
  },
  "Side profile": {
    value: "Side profile",
    label: "Side profile",
    helper:
      "Best for chase geometry, body length, stride clarity, and left-to-right pressure.",
    imageFraming:
      "Camera angle preset: side-profile documentary framing, movement line visible across the frame, both full bodies readable.",
    runwayFraming:
      "Camera preset: side-profile tracking read; preserve the movement line and full-body spacing.",
    klingFraming:
      "Camera preset: side-profile wildlife framing with the action line visible across the frame.",
    lightingContinuity:
      "Keep side light consistent enough that silhouettes and body outlines stay easy to read.",
  },
  "Low-angle power": {
    value: "Low-angle power",
    label: "Low-angle power",
    helper:
      "Best for dominance, rut clash, defender posture, and grounded impact without hiding anatomy.",
    imageFraming:
      "Camera angle preset: low camera position with a slight upward read, full bodies still visible, grounded paw or hoof contact clear.",
    runwayFraming:
      "Camera preset: low camera height with a slight upward read; keep full bodies visible.",
    klingFraming:
      "Camera preset: low-angle documentary power framing, full bodies visible with grounded contact.",
    lightingContinuity:
      "Keep low-angle rim light stable so silhouettes stay separated from the habitat.",
  },
  "Over-the-shoulder": {
    value: "Over-the-shoulder",
    label: "Over-the-shoulder",
    helper:
      "Best for tense standoffs where one animal frames the danger approaching from the far side.",
    imageFraming:
      "Camera angle preset: over-the-shoulder wildlife relationship, foreground shoulder edge framing the distant opponent, both subjects still readable.",
    runwayFraming:
      "Camera preset: over-shoulder relationship read; foreground edge stays stable while the far subject remains readable.",
    klingFraming:
      "Camera preset: over-the-shoulder wildlife framing with a readable foreground-to-background threat line.",
    lightingContinuity:
      "Match foreground and background lighting so the shoulder edge does not swallow the distant subject.",
  },
  Overhead: {
    value: "Overhead",
    label: "Overhead",
    helper:
      "Best for spacing, escape routes, pack geometry, and readable predator-prey positioning.",
    imageFraming:
      "Camera angle preset: overhead high-angle documentary read, spacing geometry visible, silhouettes separated, terrain layout clear.",
    runwayFraming:
      "Camera preset: high overhead read; keep spacing geometry and movement paths clear.",
    klingFraming:
      "Camera preset: overhead wildlife geometry, with subjects separated and movement paths readable.",
    lightingContinuity:
      "Keep top-light and shadow direction consistent so overhead silhouettes remain clear.",
  },
  Waterline: {
    value: "Waterline",
    label: "Waterline",
    helper:
      "Use only for riverbank, marsh, shallow-water, or shoreline scenes where the water edge matters.",
    imageFraming:
      "Camera angle preset: waterline-level framing at the bank, wet foreground edge, subjects readable above the surface.",
    runwayFraming:
      "Camera preset: waterline-height read; keep the bank edge and subject spacing visible.",
    klingFraming:
      "Camera preset: waterline wildlife framing with readable bank-edge timing and clear subject separation.",
    lightingContinuity:
      "Keep water-edge highlights consistent without adding glare that hides animal silhouettes.",
  },
  "Ground-level tension": {
    value: "Ground-level tension",
    label: "Ground-level tension",
    helper:
      "Best for close terrain texture, stalking tension, and first-frame threat without a full redesign.",
    imageFraming:
      "Camera angle preset: ground-level animal-height framing, foreground terrain texture, low readable tension without hiding legs.",
    runwayFraming:
      "Camera preset: ground-level animal-height read; keep legs and spacing visible.",
    klingFraming:
      "Camera preset: ground-level wildlife tension with foreground texture and full-body readability.",
    lightingContinuity:
      "Keep low foreground shadows controlled so terrain texture does not obscure the animals.",
  },
};

export function getCameraAnglePresetDefinition(
  preset: CameraAnglePreset | undefined
): CameraAnglePresetDefinition {
  return cameraAnglePresetDefinitions[
    isCameraAnglePreset(preset) ? preset : DEFAULT_CAMERA_ANGLE_PRESET
  ];
}

function hasWaterCompatibleEnvironment(environment: string): boolean {
  return /\b(waterline|riverbank|bank|shoreline|shore|current|rapids|water|lake|swamp|marsh|coast|shallows?)\b/i.test(
    environment
  );
}

export function isWaterCompatibleCameraHabitat(
  habitatMode: string,
  environment = ""
): boolean {
  return (
    WATER_COMPATIBLE_HABITAT_MODES.has(habitatMode) ||
    hasWaterCompatibleEnvironment(environment)
  );
}

function getSafePresetDefinition(
  preset: CameraAnglePreset | undefined,
  habitatMode: string,
  environment = ""
): CameraAnglePresetDefinition {
  const definition = getCameraAnglePresetDefinition(preset);
  if (
    definition.value === "Waterline" &&
    !isWaterCompatibleCameraHabitat(habitatMode, environment)
  ) {
    return {
      ...cameraAnglePresetDefinitions["Ground-level tension"],
      helper:
        "Dry habitat fallback for Waterline: keep the camera low and readable without adding water-edge language.",
    };
  }
  return definition;
}

export function buildImageCameraPresetLine(
  preset: CameraAnglePreset | undefined,
  habitatMode: string,
  environment = ""
): string {
  return getSafePresetDefinition(preset, habitatMode, environment).imageFraming;
}

export function buildRunwayCameraPresetLine(
  preset: CameraAnglePreset | undefined,
  habitatMode: string,
  environment = ""
): string {
  return getSafePresetDefinition(preset, habitatMode, environment).runwayFraming;
}

export function buildKlingCameraPresetLine(
  preset: CameraAnglePreset | undefined,
  habitatMode: string,
  environment = ""
): string {
  return getSafePresetDefinition(preset, habitatMode, environment).klingFraming;
}

export function buildCameraLightingContinuityLine(
  preset: CameraAnglePreset | undefined,
  habitatMode: string,
  environment = ""
): string {
  return getSafePresetDefinition(
    preset,
    habitatMode,
    environment
  ).lightingContinuity;
}
