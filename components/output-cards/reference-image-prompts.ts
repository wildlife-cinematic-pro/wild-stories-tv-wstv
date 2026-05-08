const PRODUCTION_REFERENCE_SAFETY_LINE =
  "No blood, no gore, no visible wounds, no duplicate animals, no humans, no text, no watermark, no graphic injury.";

export type EnvironmentMasterReferencePromptInput = {
  environmentName: string;
  leadAnimalName?: string;
  oppositeAnimalName?: string;
  arcName?: string;
  cameraAnglePreset?: string;
};

function normalizeReferenceText(value?: string) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAnyKeyword(text: string, keywords: readonly string[]) {
  return keywords.some((keyword) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\$&");
    const pattern = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`);
    return pattern.test(text);
  });
}

function buildFutureSceneLabel(input: EnvironmentMasterReferencePromptInput) {
  const leadAnimalName = input.leadAnimalName?.trim();
  const oppositeAnimalName = input.oppositeAnimalName?.trim();

  if (leadAnimalName && oppositeAnimalName) {
    return `Build the empty habitat around a future ${leadAnimalName} vs ${oppositeAnimalName} scene, but do not include animals.`;
  }

  return "Build the empty habitat as a future-ready wildlife confrontation plate, but do not include animals.";
}

export function inferEnvironmentActionGeometry(
  input: EnvironmentMasterReferencePromptInput
) {
  const lead = normalizeReferenceText(input.leadAnimalName);
  const opposite = normalizeReferenceText(input.oppositeAnimalName);
  const arc = normalizeReferenceText(input.arcName);
  const environment = normalizeReferenceText(input.environmentName);
  const camera = normalizeReferenceText(input.cameraAnglePreset);
  const combined = [lead, opposite, arc, environment, camera]
    .filter(Boolean)
    .join(" ");

  const packPredator = hasAnyKeyword(combined, ["wolf", "wolves", "dog", "wild dog", "pack"]);
  const largePrey = hasAnyKeyword(combined, ["bison", "elk", "deer", "boar", "buffalo"]);
  const largeVsLarge = hasAnyKeyword(combined, ["boar", "bear", "bison", "elk", "buffalo"]);
  const defenderOrStandoff = hasAnyKeyword(combined, [
    "defender",
    "defensive",
    "standoff",
    "stare down",
    "charge",
  ]);
  const smallPrey = hasAnyKeyword(combined, [
    "fox",
    "rabbit",
    "hare",
    "rodent",
    "squirrel",
    "small prey",
  ]);
  const waterlineAmbush = hasAnyKeyword(combined, [
    "alligator",
    "crocodile",
    "caiman",
    "marsh",
    "swamp",
    "waterline",
    "river edge",
    "riverbank",
    "shoreline",
  ]);
  const birdPredator = hasAnyKeyword(combined, [
    "eagle",
    "hawk",
    "owl",
    "falcon",
    "bird",
    "raptor",
  ]);

  if (packPredator && largePrey) {
    return "Broad water-edge pressure corridor, sawgrass or cover pockets for multiple low predators, a heavy-animal crossing lane, readable ground plane, foreground texture, midground action lane, layered background depth, and clear subject-ready space.";
  }

  if (largeVsLarge && defenderOrStandoff) {
    return "Close muddy-bank confrontation zone, firm shoreline or ground contact points, an open center charge lane, readable ground plane, foreground texture, midground action lane, layered background depth, and clear subject-ready space.";
  }

  if (smallPrey) {
    return "Low narrow zigzag escape corridor, close readable ground plane, tight grass or brush pockets, foreground texture, midground action lane, layered background depth, and clear subject-ready space.";
  }

  if (waterlineAmbush) {
    return "Waterline ambush crossing lane, shallow reflective water, a bank entry and exit path, readable ground plane, foreground texture, midground action lane, layered background depth, and clear subject-ready space.";
  }

  if (birdPredator) {
    return "Open strike corridor with clear sky window, a readable perch or launch point, layered depth for approach lines, readable ground plane, foreground texture, midground action lane, and clear subject-ready space.";
  }

  if (largeVsLarge) {
    return "Heavy confrontation corridor with firm ground contact zones, an open central crossing lane, readable ground plane, foreground texture, midground action lane, layered background depth, and clear subject-ready space.";
  }

  return "Open central attack/escape corridor, clear subject-ready space, readable ground plane, foreground texture, midground action lane, layered background depth, and simple side framing that does not block future silhouettes.";
}

export function buildAnimalMasterReferencePrompt({
  subjectName,
  stanceLabel,
  identityMarkers,
  contactLabel,
  role,
}: {
  subjectName: string;
  stanceLabel: string;
  identityMarkers: string;
  contactLabel: string;
  role: "lead" | "opposite";
}) {
  const postureLine =
    role === "lead"
      ? "Full body visible in an alert pressure-ready stance, readable head profile, clear eyes, species-specific identity, readable body mass, limbs fully visible, not cropped, documentary realism."
      : "Full body visible in an alert survival-reaction stance, readable side profile, head turned toward danger, species-specific identity, readable scale, body angled for later compositing, limbs fully visible, not cropped, documentary realism.";

  return [
    `Photorealistic wildlife documentary master reference image, 9:16 vertical.`,
    `${subjectName} only.`,
    postureLine,
    `${stanceLabel}, ${identityMarkers}, realistic scale, ${contactLabel}, stable anatomy, clean silhouette, natural expression, clean subject separation, simple uncluttered natural background, production-ready wildlife master reference image.`,
    PRODUCTION_REFERENCE_SAFETY_LINE,
  ].join(" ");
}

export function buildEnvironmentMasterReferencePrompt(
  input: string | EnvironmentMasterReferencePromptInput
) {
  if (typeof input === "string") {
    return [
      `Photorealistic ${input} environment/background reference, 9:16 vertical.`,
      `Environment only, no animals, no humans.`,
      `Open central attack/escape corridor, clear subject-ready space, readable ground plane, foreground texture, midground action lane, layered background depth, simple side framing that does not block future silhouettes, natural lighting, cinematic documentary realism, environment-only video-ready master background reference.`,
      `No text, no watermark, no fantasy elements, no clutter blocking the future animal lane.`,
    ].join(" ");
  }

  const environmentName = input.environmentName;
  const geometryLine = inferEnvironmentActionGeometry(input);
  const futureSceneLine = buildFutureSceneLabel(input);

  return [
    `Photorealistic ${environmentName} environment/background reference, 9:16 vertical.`,
    `Environment only, no animals, no humans.`,
    futureSceneLine,
    `${geometryLine} Natural lighting, cinematic documentary realism, environment-only video-ready master background reference.`,
    `No text, no watermark, no fantasy elements, no clutter blocking the future animal lane.`,
  ].join(" ");
}

export function buildFinalMergeMasterPrompt({
  leadAnimalName,
  oppositeAnimalName,
  environmentName,
  leadTag,
  oppositeTag,
  environmentTag,
}: {
  leadAnimalName: string;
  oppositeAnimalName: string;
  environmentName: string;
  leadTag: string;
  oppositeTag: string;
  environmentTag: string;
}) {
  void leadTag;
  void oppositeTag;
  void environmentTag;

  return [
    `Use the 3 prepared reference images:`,
    ``,
    `1. Lead animal reference image for ${leadAnimalName} identity: coat, head profile, body scale, and grounded paw/hoof/foot contact.`,
    `2. Opposite animal reference image for ${oppositeAnimalName} identity: coat, body scale, legs, and grounded paw/hoof/foot contact.`,
    `3. Environment reference image for background, lighting, ground texture, and atmosphere.`,
    ``,
    `Photorealistic wildlife documentary final scene master image, 9:16 vertical. ${leadAnimalName} on the left in a readable pressure-ready posture, ${oppositeAnimalName} on the right in a readable survival-reaction posture, both full-body visible with stable anatomy, grounded contact, clean subject separation, and one clear open attack/escape corridor between them. ${environmentName} provides the background, light, ground plane, and atmospheric depth only. Cinematic telephoto documentary framing, video-ready source frame. No blood, no gore, no visible wounds, no graphic injury, no duplicate animals, no humans, no text or watermark.`,
  ].join("\n");
}
