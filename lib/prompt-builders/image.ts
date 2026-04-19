import type {
  Arc,
  DepthMode,
  Weather,
  EmotionalTone,
  AnimalVibe,
  ImagePromptTarget,
  QualityOptions,
  ShotImagePlan,
  StructuredPrompt,
} from "@/types";

import { animalVibePrompt, emotionalTonePrompt } from "@/lib/predator-data";

import {
  getHabitatMode,
  getSafeArcLabel,
  oneActionArcBeat,
  buildMicroMotionLine,
} from "@/lib/prompt-builders/habitat";
import {
  getDepthPrompt,
  buildStructuredPrompt,
} from "@/lib/prompt-builders/shared";
import {
  finalizePrompt,
  clipPromptContext,
  stripLegacyImageFlags,
  sanitizeImageEnv,
  sanitizeWeatherPhrase,
  sanitizeLightingPhrase,
  sanitizeImageTexture,
  sanitizeVideoBeatText,
} from "@/lib/prompt-builders/sanitizers";
import { weatherVariants } from "@/lib/predator-data";

function buildNanoBananaImagePrompt(
  predator: string,
  prey: string,
  cleanEnv: string,
  arc: string,
  cleanLighting: string,
  cleanTexture: string,
  depth: ReturnType<typeof getDepthPrompt>,
  animalVibe: AnimalVibe,
  habitatMode: ReturnType<typeof getHabitatMode>,
  sanitizedSceneDesc: string,
  quality?: QualityOptions
): string {
  const vibe = animalVibePrompt[animalVibe];

  const subjectLine =
    habitatMode === "shoreline"
      ? `${predator} and ${prey} share one frame at the waterline in ${cleanEnv} during a high-tension ${getSafeArcLabel(arc)} beat.`
      : `${predator} and ${prey} share one frame in ${cleanEnv} during a high-tension ${getSafeArcLabel(arc)} beat.`;

  const tensionLine =
    habitatMode === "aquatic"
      ? `${predator} holds visible pressure through the water while ${prey} stays alert and reactive, with biologically plausible spacing.`
      : habitatMode === "shoreline"
        ? `${predator} holds visible pressure at the bank while ${prey} stays alert near the waterline, with natural shoreline spacing.`
        : `${predator} holds visible pre-action pressure while ${prey} stays alert and reactive, with biologically plausible spacing.`;

  const compositionLine =
    depth.lensNote === "cinematic telephoto depth separation"
      ? "Wide 9:16 vertical frame, telephoto compression, strong shallow depth separation, both animals fully visible."
      : depth.lensNote === "balanced documentary depth"
        ? "Wide 9:16 vertical frame, telephoto framing, clear midground separation, both animals fully visible."
        : "Wide 9:16 vertical frame, telephoto framing, deep background visible, both animals fully visible.";

  const atmosphereLine = `Lighting: ${cleanLighting}. Clear air, terrain visible from foreground to background.`;
  const detailLine = vibe.texture
    ? `Photoreal wildlife detail with ${cleanTexture}. ${vibe.texture}.`
    : `Photoreal wildlife detail with ${cleanTexture}.`;

  const anatomyLine =
    quality?.realismMode === "High Naturalism"
      ? "Accurate predator and prey anatomy, natural coat markings, visible paw or hoof contact with the ground, realistic fur imperfections and biological wear."
      : quality?.realismMode === "Reference Locked"
        ? "Accurate predator and prey anatomy, natural coat markings, stable silhouettes, and visible paw or hoof contact with the ground."
        : "Accurate predator and prey anatomy, natural coat markings, and visible paw or hoof contact with the ground.";

  const sceneNote = sanitizedSceneDesc
    ? ` Scene note: ${clipPromptContext(sanitizedSceneDesc, 120)}`
    : "";

  return `${subjectLine} ${tensionLine} ${compositionLine} Depth of field: ${depth.depth}. ${atmosphereLine} ${detailLine} ${anatomyLine} Photorealistic wildlife documentary style.${sceneNote}`;
}

export function buildImagePromptCard(
  predator: string,
  prey: string,
  env: string,
  arc: string,
  lighting: string,
  cameraGear: string,
  texture: string,
  depthMode: DepthMode,
  weather: Weather,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions,
  target: ImagePromptTarget = "NANO_BANANA_2"
): StructuredPrompt {
  void emotionalTone;
  void cameraGear;
  void target;

  const depth = getDepthPrompt(depthMode);
  const cleanEnv = sanitizeImageEnv(env);
  const cleanTexture = sanitizeImageTexture(texture, env);
  const cleanLighting = sanitizeLightingPhrase(lighting, weather);
  const sanitizedSceneDesc = stripLegacyImageFlags(sceneDesc?.trim() ?? "");
  const habitatMode = getHabitatMode(predator, prey, env);

  const prompt = finalizePrompt(
    buildNanoBananaImagePrompt(
      predator,
      prey,
      cleanEnv,
      arc,
      cleanLighting,
      cleanTexture,
      depth,
      animalVibe,
      habitatMode,
      sanitizedSceneDesc,
      quality
    )
  );

  return buildStructuredPrompt({
    fullText: prompt,
    pasteReady: prompt,
    metadata: {
      engine: "image",
      title: "Nano Banana 2 / Gemini master still",
      variant: "single-shot",
    },
  });
}

export function buildImagePrompt(
  predator: string,
  prey: string,
  env: string,
  arc: string,
  lighting: string,
  cameraGear: string,
  texture: string,
  depthMode: DepthMode,
  weather: Weather,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions,
  target: ImagePromptTarget = "NANO_BANANA_2"
): string {
  return buildImagePromptCard(
    predator,
    prey,
    env,
    arc,
    lighting,
    cameraGear,
    texture,
    depthMode,
    weather,
    emotionalTone,
    animalVibe,
    sceneDesc,
    quality,
    target
  ).fullText;
}

export function buildShotImagePlan(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  quality?: QualityOptions
): ShotImagePlan[] {
  const habitatMode = getHabitatMode(predator, prey, env);
  const cleanEnv = sanitizeImageEnv(env);
  const cleanWeather = sanitizeWeatherPhrase(weatherVariants[weather]);
  const micro = buildMicroMotionLine(weather, env);
  const gateOn = !!quality?.singleActionRule;

  const action = oneActionArcBeat(arc, "action", gateOn, habitatMode);
  const aftermath = oneActionArcBeat(arc, "aftermath", gateOn, habitatMode);

  const openingPredator =
    habitatMode === "aquatic"
      ? "holds controlled pressure through the water on the left"
      : habitatMode === "shoreline"
        ? "holds low visible pressure at the waterline on the left"
        : "holds readable pre-action pressure on the left";

  const openingPrey =
    habitatMode === "shoreline"
      ? "stays fully alert near the bank on the right"
      : "stays fully alert and reactive on the right";

  const pressurePredator =
    habitatMode === "aquatic"
      ? "leans into stronger forward water pressure without breaking spacing"
      : habitatMode === "shoreline"
        ? "leans farther forward from the bank with stronger visible ambush pressure"
        : "leans farther forward with stronger visible pressure";

  const pressurePrey =
    habitatMode === "aquatic"
      ? "makes one tighter defensive adjustment in the current"
      : habitatMode === "shoreline"
        ? "lowers into one readable defensive footing adjustment near the bank"
        : "lowers into one readable defensive adjustment";

  const peakPredator = sanitizeVideoBeatText(action.predatorBeat);
  const peakPrey = sanitizeVideoBeatText(action.preyBeat);
  const resolvePredator = sanitizeVideoBeatText(aftermath.predatorBeat);
  const resolvePrey = sanitizeVideoBeatText(aftermath.preyBeat);

  const continuityLock = `Keep ${predator} and ${prey} identical in anatomy, markings, scale, lighting family, and habitat continuity in ${cleanEnv}, ${cleanWeather}. Preserve the same 9:16 documentary image family, grounded contact, realistic spacing, and clean silhouette separation.`;
  const atmosphereLock = `Environmental response stays subtle and scene-correct: ${micro}.`;
  const masterBase =
    "Base image: use the Nano Banana 2 / Gemini master still as the continuity anchor.";
  const continuityBase =
    "Base image: use the previous continuity image derived from the Nano Banana master still.";

  return [
    {
      title: "Shot 1 Image — Opening Tension",
      source: "master",
      prompt: finalizePrompt(
        `${masterBase} ${continuityLock} Reframe into a wide opening shot with both subjects fully readable from frame one. The ${predator} ${openingPredator}. The ${prey} ${openingPrey}. Keep the existing style and composition family intact. ${atmosphereLock}`
      ),
    },
    {
      title: "Shot 2 Image — Pressure Build",
      source: "previous_image",
      prompt: finalizePrompt(
        `${continuityBase} ${continuityLock} Tighten the frame slightly for the pressure-build beat. The ${predator} ${pressurePredator}. The ${prey} ${pressurePrey}. Keep the lighting family and visual continuity stable. ${atmosphereLock}`
      ),
    },
    {
      title: "Shot 3 Image — Peak Action",
      source: "previous_image",
      prompt: finalizePrompt(
        `${continuityBase} ${continuityLock} Advance into the peak action beat with one dominant readable action. The ${predator} ${peakPredator}. The ${prey} ${peakPrey}. Preserve full-body readability, clear predator-to-prey spacing, believable traction, and strong biomechanical clarity. ${atmosphereLock}`
      ),
    },
    {
      title: "Shot 4 Image — Resolved Tension",
      source: "previous_image",
      prompt: finalizePrompt(
        `${continuityBase} ${continuityLock} Move into the immediate aftermath or resolved tension beat. The ${predator} ${resolvePredator}. The ${prey} ${resolvePrey}. Preserve readable spacing to the final frame, stable anatomy, and clean continuity. ${atmosphereLock}`
      ),
    },
  ];
}

export function buildNegativePrompt(
  predator: string,
  engine: "KLING" | "RUNWAY" | "SEEDANCE" = "KLING"
): string {
  if (engine !== "KLING") {
    return "";
  }

  const base =
    "cartoon, CGI look, anime style, illustration, game render, unnatural motion, morphing artifacts, " +
    "split screen, floating limbs, jerky movement, watermark, text overlay, subtitle burn-in, " +
    "extra limbs, extra tails, extra heads, duplicate animals, wrong animal count, merged bodies, " +
    "partial body crop, cut-off paws, cut-off hooves, cut-off tails, hidden subjects, overlapping bodies, " +
    "close-up crop, off-frame subject, face distortion, warping, melting anatomy, inconsistent physics, " +
    "background shifting, changing markings, deformed anatomy, plastic fur, oversharpened HDR, synthetic glow, " +
    "fire, flame, fantasy breath, glowing mouth, energy effect, light beam, smoke plume, steam, mist, haze, fog wall, dusty blur, bright unnatural colors";

  const specific: Record<string, string> = {
    Lion: "wrong mane colour, extra mane, mane drift between shots",
    Tiger: "wrong stripe pattern, blurry markings, stripe morphing",
    "Siberian Tiger": "wrong stripe density, tropical setting, stripe warping",
    Leopard: "wrong rosette pattern, rosette morphing",
    Jaguar: "wrong spot pattern, spot shifting",
    "Snow Leopard": "wrong spot pattern, short tail, tail length changing",
    Cheetah: "wrong tear marks, thick mane, tear mark drift",
    Shark: "cartoon fins, fin morphing, reef setting for open-water action",
    Orca: "wrong colour pattern, pattern shifting between frames",
    "Komodo Dragon": "wrong scale pattern, scale morphing",
    "Polar Bear": "wrong fur colour, tropical environment, fur colour drift",
    Bobcat: "wrong spot pattern, long tail, marking inconsistency",
    Wolf: "dog-like face, domestic dog body proportions, fluffy pet fur, inconsistent coat pattern",
    "Wolf Pack":
      "pack member drift, inconsistent wolf count, mismatched coat patterns between wolves, merged bodies, extra legs, dog-like faces",
    Coyote: "dog-like face, domestic dog proportions, oversized body, inconsistent coat pattern",
    Alligator: "wrong scale pattern, fictional setting, jaw deformation",
    "Mountain Lion": "spotted juvenile coat, exaggerated mane, wrong tail length, house-cat face",
    Cougar: "spotted juvenile coat, exaggerated mane, wrong tail length, house-cat face",
    "Grizzly Bear": "undersized body, black-bear face, wrong shoulder hump, wrong fur colour",
    "Bald Eagle": "wrong beak shape, wrong head colour, juvenile plumage in adult scene, deformed wings",
  };

  return finalizePrompt(`${base}${specific[predator] ? `, ${specific[predator]}` : ""}`);
}

export function buildThumbnailPrompt(
  predator: string,
  prey: string,
  env: string,
  weather: Weather,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe
): string {
  const tone = emotionalTonePrompt[emotionalTone];
  const vibe = animalVibePrompt[animalVibe];
  const cleanEnv = sanitizeImageEnv(env);
  const cleanWeather = sanitizeWeatherPhrase(weatherVariants[weather]);
  const cleanAir =
    "clear clean air, no visible steam, no smoke plumes, no mist, no airborne haze";

  const envLower = env.toLowerCase();
  const isArcticLike =
    envLower.includes("arctic") ||
    envLower.includes("snow") ||
    envLower.includes("tundra") ||
    envLower.includes("ice") ||
    envLower.includes("glacier") ||
    envLower.includes("frozen") ||
    envLower.includes("winter");

  const winterThumbDetail =
    isArcticLike && weather === "Golden Hour"
      ? "pale blue snow shadows, crisp clean winter air, clear backlight through pine trees, sharp silhouette separation on snow, "
      : "";

  return finalizePrompt(
    `Ultra dramatic wildlife documentary thumbnail with ${predator} and ${prey} both clearly readable in the same frame, immediate visible tension, strong subject separation, no empty setup, mobile-first composition, in ${cleanEnv}, ${cleanWeather}, ${cleanAir}. ${tone.image}. Intense mutual awareness, raw animal instinct, ${winterThumbDetail}${vibe.style}. Photorealistic documentary realism, 9:16 vertical frame.`
  );
}

function withArticle(animal: string): string {
  const lower = animal.toLowerCase();
  const article = /^[aeiou]/.test(lower) ? "an" : "a";
  return `${article} ${lower}`;
}

export function buildVoiceoverLine(
  predator: string,
  prey: string,
  env: string,
  emotionalTone: EmotionalTone
): string {
  const cleanEnv = sanitizeImageEnv(env);
  const predatorLabel = withArticle(predator);
  const preyLabel = withArticle(prey);

  const lineByTone: Record<EmotionalTone, string> = {
    "Raw Tension": `In ${cleanEnv}, ${predatorLabel} holds visible pressure while ${preyLabel} watches the gap close.`,
    "Silent Dread": `In ${cleanEnv}, the space looks calm, but ${predatorLabel} is already set and ${preyLabel} is reading it.`,
    "Explosive Energy": `In ${cleanEnv}, ${predatorLabel} commits fast and ${preyLabel} has one reaction window.`,
    "Calm Dominance": `In ${cleanEnv}, ${predatorLabel} controls the space and ${preyLabel} is forced to answer it.`,
    "Desperate Survival": `In ${cleanEnv}, ${preyLabel} is already under pressure as ${predatorLabel} closes the last safe distance.`,
    "Haunting Stillness": `In ${cleanEnv}, both animals hold for a beat, but the threat line is already clear.`,
    "Primal Instinct": `In ${cleanEnv}, ${predatorLabel} moves on instinct and ${preyLabel} reacts before there is time to think.`,
  };

  return finalizePrompt(lineByTone[emotionalTone]);
}
