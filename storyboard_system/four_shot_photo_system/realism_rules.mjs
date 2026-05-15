export const ENVIRONMENT_LOCK_RULES = [
  "same terrain and trail/path geometry across every shot",
  "same grass or sagebrush density and height",
  "same treeline placement and distant ridge/habitat identity",
  "same season, lighting direction, color tone, and atmosphere",
  "no environment redesign, no random new landmarks, no weather drift"
];

export const ANIMAL_REALISM_RULES = [
  "correct body mass and stable anatomy for each species",
  "correct predator/prey scale relationship",
  "natural posture with clean readable silhouettes",
  "grounded paw and hoof contact with no floating animals",
  "believable wildlife behavior and threat awareness",
  "same animal identity markers across all shots"
];

export const PHYSICAL_INTEGRATION_RULES = [
  "soft natural cast shadows and contact shadows at paws and hooves",
  "grass and sagebrush interaction around legs",
  "subtle terrain displacement where feet meet dirt or dry grass",
  "matching rim light and atmospheric perspective",
  "no pasted, cutout, collage, or composited look"
];

export const NEGATIVE_REALISM_RULES = [
  "no oversaturated fantasy look",
  "no fake HDR or plastic fur",
  "no excessive blur or impossible lens distortion",
  "no melted anatomy, duplicate limbs, extra animals, people, roads, fences, buildings, text, watermark, subtitles",
  "no blood, no gore, no visible wounds, no graphic contact"
];

export function continuityChecklistForShot(shot) {
  return [
    ...ENVIRONMENT_LOCK_RULES,
    ...ANIMAL_REALISM_RULES,
    ...PHYSICAL_INTEGRATION_RULES,
    "predator gaze remains locked toward prey threat direction",
    "prey attention remains locked toward predator pressure",
    shot.continuityNote
  ];
}

export function compactRuleSentence(items) {
  return items.join("; ") + ".";
}

