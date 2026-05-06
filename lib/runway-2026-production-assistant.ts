import type { Arc, KlingModel, RunwayModel } from "@/types";

const RUNWAY_SAFETY_LINE =
  "No blood, no gore, no visible wounds, no graphic injury.";
const RUNWAY_REFERENCE_SAFETY_LINE =
  "No blood, no gore, no visible wounds, no text, no watermark.";
const RUNWAY_FINAL_MERGE_SAFETY_LINE =
  "No blood, no gore, no visible wounds, no graphic injury, no duplicate animals, no humans, no text, no watermark.";

export type Runway2026AssistantInput = {
  predatorName?: string;
  preyName?: string;
  environmentName?: string;
  arcName?: Arc | string;
  sceneDescription?: string;
  runwayModel?: RunwayModel | string;
  klingModel?: KlingModel | string;
  imagePrompt?: string;
  runwayShots?: string[];
  klingShots?: string[];
  klingNative15s?: string;
  negativePrompt?: string;
  caption?: string;
  hashtags?: string;
  mainVideoPrompt?: string;
  failureRepairPromptAleph?: string;
  qaStatus?: string;
  qaScore?: number;
  qaTopFixes?: string[];
};

export type RunwayPromptWriterPack = {
  runwayI2VPrompt: string;
  referenceImagePrompt: string;
  finalMergePrompt: string;
  alephRepairPrompt: string;
  reelPrompt: string;
};

export type Runway2026AssistantPack = {
  gen45I2VPlan: string;
  alephRepairGuide: string;
  workflowBlueprint: string;
  reelRoute: string;
  promptWriter: RunwayPromptWriterPack;
};

function clean(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.replace(/\s+/g, " ").trim();
    return trimmed || fallback;
  }

  return fallback;
}

function getPredatorName(input: Runway2026AssistantInput) {
  return clean(input.predatorName, "Lead predator");
}

function getPreyName(input: Runway2026AssistantInput) {
  return clean(input.preyName, "Opposing animal");
}

function getEnvironmentName(input: Runway2026AssistantInput) {
  return clean(input.environmentName, "wildlife habitat");
}

function getArcName(input: Runway2026AssistantInput) {
  return clean(input.arcName, "wildlife pressure arc");
}

function getRunwayModel(input: Runway2026AssistantInput) {
  return clean(input.runwayModel, "Gen-4.5");
}

function getKlingModel(input: Runway2026AssistantInput) {
  return clean(input.klingModel, "Kling 3.0 Pro");
}

function getSceneDescription(input: Runway2026AssistantInput) {
  return clean(input.sceneDescription, "one clean wildlife confrontation");
}

function getQaLine(input: Runway2026AssistantInput) {
  if (!input.qaStatus && typeof input.qaScore !== "number") {
    return "";
  }

  const status = clean(input.qaStatus, "Needs review");
  const score = typeof input.qaScore === "number" ? `${input.qaScore}/100` : "--/100";
  return `Current QA: ${status} (${score}).`;
}

function getQaFixLine(input: Runway2026AssistantInput) {
  const fixes = (input.qaTopFixes ?? [])
    .map((fix) => clean(fix))
    .filter(Boolean)
    .slice(0, 3);

  return fixes.length > 0 ? `Top fixes: ${fixes.join(" | ")}.` : "";
}

function buildFallbackMotionBrief(input: Runway2026AssistantInput) {
  const predator = getPredatorName(input);
  const prey = getPreyName(input);
  const environment = getEnvironmentName(input);
  const arc = getArcName(input);
  const sceneDescription = getSceneDescription(input);

  return [
    `${predator} on the left and ${prey} on the right in ${environment}.`,
    `Motion-first wildlife direction for ${arc}: ${sceneDescription}.`,
    "Keep both animals full-body readable, preserve stable anatomy, grounded contact, one clear attack or escape corridor, readable spacing, and smooth temporal progression.",
  ].join(" ");
}

function getPrimaryMotionPrompt(input: Runway2026AssistantInput) {
  const preferred = [
    input.runwayShots?.[0],
    input.mainVideoPrompt,
    input.klingShots?.[0],
    input.klingNative15s,
  ]
    .map((value) => clean(value))
    .find(Boolean);

  return preferred || buildFallbackMotionBrief(input);
}

function getReferenceBasePrompt(input: Runway2026AssistantInput) {
  return clean(
    input.imagePrompt,
    `${getPredatorName(input)} on the left and ${getPreyName(input)} on the right in ${getEnvironmentName(input)}, both full-body visible with stable anatomy, grounded contact, clean silhouette, and wildlife documentary realism.`
  );
}

function getAlephBasePrompt(input: Runway2026AssistantInput) {
  return clean(
    input.failureRepairPromptAleph,
    `Preserve ${getPredatorName(input)} and ${getPreyName(input)} in ${getEnvironmentName(input)} with the original timing, habitat, source-frame lighting, and edit intent.`
  );
}

function getRouteOpeningPrompt(input: Runway2026AssistantInput) {
  return clean(input.runwayShots?.[0], buildFallbackMotionBrief(input));
}

function getRoutePressurePrompt(input: Runway2026AssistantInput) {
  return clean(
    input.klingShots?.[1] || input.klingShots?.[0],
    clean(input.klingNative15s, buildFallbackMotionBrief(input))
  );
}

function getRoutePeakPrompt(input: Runway2026AssistantInput) {
  return clean(
    input.klingNative15s || input.klingShots?.[2] || input.klingShots?.[1],
    buildFallbackMotionBrief(input)
  );
}

function getRouteResolvePrompt(input: Runway2026AssistantInput) {
  return clean(input.runwayShots?.[3] || input.runwayShots?.[1], buildFallbackMotionBrief(input));
}

function getCaptionLine(input: Runway2026AssistantInput) {
  const caption = clean(input.caption);
  return caption ? `Caption: ${caption}` : "";
}

function getHashtagLine(input: Runway2026AssistantInput) {
  const hashtags = clean(input.hashtags);
  return hashtags ? `Hashtags: ${hashtags}` : "";
}

export function buildRunwayGen45I2VGuidePrompt(input: Runway2026AssistantInput) {
  const runwayModel = getRunwayModel(input);
  const motionPrompt = getPrimaryMotionPrompt(input);

  return [
    `${runwayModel} Image-to-Video production plan.`,
    "Upload the final scene master image or a clean continuity frame before prompting motion.",
    "Format: 9:16 vertical, 24/25fps, WSTV default 5s. Runway supports 2-10s per shot.",
    "Runway has no negative prompt. Let identity, composition, lighting, and style come from the image; use text for motion, camera, physics, spacing, and temporal progression only.",
    `Motion brief: ${motionPrompt}`,
    "Keep both animals full-body readable, preserve stable anatomy and grounded contact, and hold one clear attack or escape lane through the shot.",
    RUNWAY_SAFETY_LINE,
  ].join("\n");
}

export function buildRunwayReferenceImagePrompt(input: Runway2026AssistantInput) {
  return [
    "Runway Gen-4 reference image, 9:16 vertical, full-body readable, stable anatomy, grounded contact, clean silhouette.",
    getReferenceBasePrompt(input),
    RUNWAY_REFERENCE_SAFETY_LINE,
  ].join("\n");
}

export function buildRunwayFinalMergePrompt(input: Runway2026AssistantInput) {
  const predator = getPredatorName(input);
  const prey = getPreyName(input);
  const environment = getEnvironmentName(input);

  return [
    "Use exactly 3 active Runway references: @hero_predator, @hero_prey, @env_plate.",
    "Use @hero_predator only for predator identity.",
    "Use @hero_prey only for prey/opposite animal identity.",
    "Use @env_plate only for background, lighting, ground texture, and atmosphere.",
    `Final scene: ${predator} left, ${prey} right, both full-body visible with one clear open attack/escape corridor in ${environment}.`,
    "Photorealistic wildlife documentary, 9:16 vertical, stable anatomy, grounded contact, clean silhouette separation, readable terrain, and video-ready source framing.",
    RUNWAY_FINAL_MERGE_SAFETY_LINE,
  ].join("\n");
}

export function buildRunwayAlephRepairCardPrompt(input: Runway2026AssistantInput) {
  const qaLine = getQaLine(input);
  const qaFixLine = getQaFixLine(input);

  return [
    "Aleph 5-second repair/edit pass only. Do not rebuild the shot from scratch.",
    "Remove extra or duplicate animals, change only the broken section, replace wrong lighting with original source-frame lighting, re-light if drifted, re-style only if continuity slips, widen camera if cropped, stabilize excessive camera shake, preserve grounded paw or hoof contact, and remove gore or injury if any appears.",
    "Preserve original timing, animal identities, habitat, source-frame lighting, and edit intent.",
    qaLine,
    qaFixLine,
    getAlephBasePrompt(input),
    RUNWAY_SAFETY_LINE,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildRunwayWorkflowBlueprint(input: Runway2026AssistantInput) {
  return [
    "Runway Workflows manual blueprint (guide only).",
    `1. Text Input: ${getPredatorName(input)} / ${getPreyName(input)} / ${getEnvironmentName(input)} / ${getSceneDescription(input)}`,
    "2. LLM Node: prompt enhancer",
    "3. Gen-4 Image Node: lead animal reference",
    "4. Gen-4 Image Node: opposite animal reference",
    "5. Gen-4 Image Node: environment plate",
    "6. Gen-4 References / Image Node: final merge master image with exactly 3 references",
    "7. Gen-4.5 I2V Node: Shot 1 opening tension",
    "8. Utility Node: extract clean last frame",
    `9. ${getKlingModel(input)} or alternate video model node: Shot 2 pressure/action`,
    `10. ${getKlingModel(input)} or alternate video model node: Shot 3 peak action`,
    "11. Gen-4.5 I2V Node: Shot 4 resolved tension",
    "12. Utility Node: stitch / export / upscale where available",
  ].join("\n");
}

export function buildRunway15sReelRoute(input: Runway2026AssistantInput) {
  const opening = getRouteOpeningPrompt(input);
  const pressure = getRoutePressurePrompt(input);
  const peak = getRoutePeakPrompt(input);
  const resolve = getRouteResolvePrompt(input);
  const captionLine = getCaptionLine(input);
  const hashtagLine = getHashtagLine(input);

  return [
    "15s Facebook Reel route (copy-only manual workflow).",
    "Option A: Runway 5s opening + Kling 5s pressure + Kling 5s peak.",
    `- Runway opening: ${opening}`,
    `- Kling pressure: ${pressure}`,
    `- Kling peak: ${peak}`,
    "",
    "Option B: Runway Gen-4.5 10s opening/action + Kling 5s final pressure.",
    `- Runway 10s opening/action: ${opening}`,
    `- Kling final pressure: ${peak}`,
    "",
    "Option C: Runway 5s opening + Kling 5s action + Runway 5s final settle.",
    `- Runway opening: ${opening}`,
    `- Kling action: ${pressure}`,
    `- Runway settle: ${resolve}`,
    "",
    "Recommended for more realism: Runway 5s -> Kling 5s -> Runway 5s.",
    "Recommended for more viral action: Runway 5s -> Kling 5s -> Kling 5s.",
    captionLine,
    hashtagLine,
    RUNWAY_SAFETY_LINE,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildRunwayGen45I2VPrompt(input: Runway2026AssistantInput) {
  const runwayModel = getRunwayModel(input);
  const motionPrompt = getPrimaryMotionPrompt(input);

  return [
    `${runwayModel} image-to-video, 9:16 vertical, 24/25fps, 5-second shot. Runway supports 2-10s per shot.`,
    "Upload the final scene master image or a clean continuity frame. Identity, composition, lighting, and style come from the image; prompt only motion, camera, physics, spacing, and temporal progression.",
    motionPrompt,
    "Keep both animals full-body readable, stable anatomy, grounded contact, readable spacing, clean silhouette separation, and one clear action lane.",
    "Runway has no negative prompt.",
    RUNWAY_SAFETY_LINE,
  ].join("\n");
}

export function buildRunwayPromptWriterPack(
  input: Runway2026AssistantInput
): RunwayPromptWriterPack {
  return {
    runwayI2VPrompt: buildRunwayGen45I2VPrompt(input),
    referenceImagePrompt: buildRunwayReferenceImagePrompt(input),
    finalMergePrompt: buildRunwayFinalMergePrompt(input),
    alephRepairPrompt: buildRunwayAlephRepairCardPrompt(input),
    reelPrompt: buildRunway15sReelRoute(input),
  };
}

export function buildRunway2026AssistantPack(
  input: Runway2026AssistantInput
): Runway2026AssistantPack {
  return {
    gen45I2VPlan: buildRunwayGen45I2VGuidePrompt(input),
    alephRepairGuide: buildRunwayAlephRepairCardPrompt(input),
    workflowBlueprint: buildRunwayWorkflowBlueprint(input),
    reelRoute: buildRunway15sReelRoute(input),
    promptWriter: buildRunwayPromptWriterPack(input),
  };
}
