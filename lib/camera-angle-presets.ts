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
      "Safest Facebook first test when both species need instant recognition, clean scale, and readable footing.",
    imageFraming:
      "Front full-body wildlife framing, subjects squared cleanly to camera, full legs visible, clean 9:16 spacing.",
    runwayFraming:
      "Frontal full-body framing with both subjects visible through the move.",
    klingFraming:
      "Front full-body framing with both subjects readable and separated.",
    lightingContinuity:
      "Keep frontal light direction consistent so body outline and scale stay easy to read.",
  },
  "Side profile": {
    value: "Side profile",
    label: "Side profile",
    helper:
      "Best for chase line, body length, stride read, and clean left-to-right pressure.",
    imageFraming:
      "Side-profile wildlife framing, movement line visible across the frame, both full bodies readable.",
    runwayFraming:
      "Side-profile tracking bias that preserves the movement line and full-body spacing.",
    klingFraming:
      "Side-profile wildlife framing with the action line visible across the frame.",
    lightingContinuity:
      "Keep side light consistent so silhouettes and stride shape stay readable.",
  },
  "Low-angle power": {
    value: "Low-angle power",
    label: "Low-angle power",
    helper:
      "Best for dominance, rut clash, defender posture, and grounded impact without hiding anatomy.",
    imageFraming:
      "Low-angle wildlife framing from a low camera position with a slight upward read, full bodies still visible, grounded paw or hoof contact clear.",
    runwayFraming:
      "Low camera height with a slight upward read while full bodies stay visible.",
    klingFraming:
      "Low-angle power framing with grounded contact and full-body readability.",
    lightingContinuity:
      "Keep low-angle rim light stable so silhouettes stay separated from the habitat.",
  },
  "Over-the-shoulder": {
    value: "Over-the-shoulder",
    label: "Over-the-shoulder",
    helper:
      "Use when one animal can frame the threat without hiding the other subject; best after a safe default test.",
    imageFraming:
      "Over-the-shoulder wildlife framing with a clear foreground edge, a distant opponent, and readable spacing between both subjects.",
    runwayFraming:
      "Over-shoulder relationship framing with a stable foreground edge and a readable far subject.",
    klingFraming:
      "Over-the-shoulder framing with a readable foreground-to-background threat line.",
    lightingContinuity:
      "Match foreground and background light so the near shoulder never swallows the far subject.",
  },
  Overhead: {
    value: "Overhead",
    label: "Overhead",
    helper:
      "Best when spacing, escape route, or pack geometry matters more than eye-level intimacy.",
    imageFraming:
      "High overhead wildlife framing with spacing geometry, silhouette separation, and terrain layout clear.",
    runwayFraming:
      "High overhead framing that keeps spacing geometry and movement paths clear.",
    klingFraming:
      "High overhead wildlife geometry with separated subjects and readable movement paths.",
    lightingContinuity:
      "Keep top-light and shadow direction consistent so overhead silhouettes stay legible.",
  },
  Waterline: {
    value: "Waterline",
    label: "Waterline",
    helper:
      "Only for real bank, marsh, shallow-water, or shoreline scenes; land scenes fall back automatically.",
    imageFraming:
      "Waterline wildlife framing at the bank with a wet foreground edge and both subjects readable above the surface.",
    runwayFraming:
      "Waterline-height framing that keeps the bank edge and subject spacing visible.",
    klingFraming:
      "Waterline wildlife framing with bank-edge timing and clear subject separation.",
    lightingContinuity:
      "Keep water-edge highlights consistent without glare swallowing the animal outlines.",
  },
  "Ground-level tension": {
    value: "Ground-level tension",
    label: "Ground-level tension",
    helper:
      "Best for stalking pressure, terrain texture, and low first-frame tension while keeping legs visible.",
    imageFraming:
      "Ground-level animal-height wildlife framing with foreground terrain texture and low readable tension without hiding legs.",
    runwayFraming:
      "Ground-level animal-height framing that keeps legs and spacing visible.",
    klingFraming:
      "Ground-level wildlife tension framing with foreground texture and full-body readability.",
    lightingContinuity:
      "Keep low foreground shadows controlled so terrain texture never obscures the animals.",
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
