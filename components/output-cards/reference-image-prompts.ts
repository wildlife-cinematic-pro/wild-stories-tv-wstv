const PRODUCTION_REFERENCE_SAFETY_LINE =
  "No blood, no gore, no visible wounds, no duplicate animals, no humans, no text, no watermark, no graphic injury.";

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
    `${stanceLabel}, ${identityMarkers}, realistic scale, ${contactLabel}, stable anatomy, clean silhouette, natural expression, clean subject separation, simple uncluttered natural background, production-ready Runway Gen-4 Image / Gemini-enhanced reference.`,
    PRODUCTION_REFERENCE_SAFETY_LINE,
  ].join(" ");
}

export function buildEnvironmentMasterReferencePrompt(environmentName: string) {
  return [
    `Photorealistic ${environmentName} environment/background reference, 9:16 vertical.`,
    `Environment only, no animals, no humans.`,
    `Open central attack/escape corridor, clear subject-ready space for two future animals, readable ground plane, foreground texture, midground action lane, layered background depth, simple side framing that does not block the future animal silhouettes, natural lighting, cinematic documentary realism, video-ready master background reference.`,
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
  return [
    `Use exactly 3 active Runway references: ${leadTag}, ${oppositeTag}, ${environmentTag}.`,
    ``,
    `Use ${leadTag} only for ${leadAnimalName} identity: coat, head profile, body scale, and grounded paw/hoof/foot contact.`,
    `Use ${oppositeTag} only for ${oppositeAnimalName} identity: coat, body scale, legs, and grounded paw/hoof/foot contact.`,
    `Use ${environmentTag} only for background, lighting, ground texture, and atmosphere.`,
    ``,
    `Photorealistic wildlife documentary final scene master image, 9:16 vertical. ${leadAnimalName} on the left in a readable pressure-ready posture, ${oppositeAnimalName} on the right in a readable survival-reaction posture, both full-body visible with stable anatomy, grounded contact, clean subject separation, and one clear open attack/escape corridor between them. ${environmentName} provides the background, light, ground plane, and atmospheric depth only. Cinematic telephoto documentary framing, video-ready source frame. No blood, no gore, no visible wounds, no graphic injury, no duplicate animals, no humans, no text or watermark.`,
  ].join("\n");
}
