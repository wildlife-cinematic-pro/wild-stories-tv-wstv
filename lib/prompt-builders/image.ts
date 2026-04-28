import type {
  Arc,
  DepthMode,
  Weather,
  EmotionalTone,
  AnimalVibe,
  CameraAnglePreset,
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
  isWaterForwardPreyScenario,
  isRutMirrorMatchScenario,
  getRutMirrorMatchCue,
} from "@/lib/prompt-builders/habitat";
import {
  getDepthPrompt,
  buildStructuredPrompt,
  buildShotWorldContinuityLock,
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
import {
  buildCameraLightingContinuityLine,
  buildImageCameraPresetLine,
} from "@/lib/camera-angle-presets";

type SceneLockState = {
  habitatLabel: string;
  habitatLocation: string;
  groundState: string;
  lightingFamily: string;
  atmosphereFamily: string;
};
const DUST_FREE_NEGATIVE_TERMS =
  "dust cloud, kicked-up dust, dirt spray, flying soil, debris particles, ground powder, sand burst, muddy splash, excessive particles, smoke-like dust, dusty blur, dust trail behind animals";
const CLEAN_GROUND_CONTACT_LINE =
  "Clean paw and hoof contact on firm vegetation-covered ground, no visible dust, no dirt spray, no debris particles, no kicked-up soil, no ground powder, no dust clouds.";


function normalizeSceneText(value: string): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSceneLockHabitat(
  cleanEnv: string
): Pick<SceneLockState, "habitatLabel" | "habitatLocation"> {
  const normalized = normalizeSceneText(cleanEnv);

  if (/river|bank|reed|cattail|willow|cottonwood|shoreline/.test(normalized)) {
    return {
      habitatLabel: "riverbank reeds",
      habitatLocation: "along riverbank reeds",
    };
  }

  if (/cypress|swamp/.test(normalized)) {
    return {
      habitatLabel: "cypress swamp edge",
      habitatLocation: "at a cypress swamp edge",
    };
  }

  if (/everglades|marsh|wetland|sawgrass/.test(normalized)) {
    return {
      habitatLabel: "marsh edge",
      habitatLocation: "at a marsh edge",
    };
  }

  if (/coastal|cliff|ocean|salt|pacific/.test(normalized)) {
    return {
      habitatLabel: "coastal cliffline",
      habitatLocation: "along a coastal cliffline",
    };
  }

  if (/pine|aspen|forest|timber|woodland/.test(normalized)) {
    return {
      habitatLabel: "pine-aspen forest clearing",
      habitatLocation: "in a pine-aspen forest clearing",
    };
  }

  if (/rocky mountain|meadow|sage|valley/.test(normalized)) {
    return {
      habitatLabel: "Rocky Mountain meadow edge",
      habitatLocation: "at a Rocky Mountain meadow edge",
    };
  }

  if (/prairie|grassland|plain|savanna/.test(normalized)) {
    return {
      habitatLabel: "open prairie grassland",
      habitatLocation: "in open prairie grassland",
    };
  }

  return {
    habitatLabel: cleanEnv,
    habitatLocation: `in ${cleanEnv}`,
  };
}

function buildSceneLockGround(
  cleanEnv: string,
  weather: Weather,
  habitatMode: ReturnType<typeof getHabitatMode>,
  isWaterForwardStrike: boolean
): string {
  const normalized = normalizeSceneText(`${cleanEnv} ${weather}`);

  if (habitatMode === "aquatic") {
    return "broken water surface and shallow current";
  }

  if (habitatMode === "shoreline") {
    return isWaterForwardStrike
      ? "muddy bank edge with shallow current"
      : "wet shoreline mud with reeds at the edge";
  }

  if (/heavy snowfall|snow-covered|deep snow|blizzard/.test(normalized) || weather === "Winter Blizzard") {
    return "snow-covered clearing";
  }

  if (/snow|frozen|frost|winter/.test(normalized) || weather === "Frozen Dusk") {
    return "patchy early snow over firm grass";
  }

  if (/forest|pine|aspen|woodland|leaf litter/.test(normalized)) {
    return "dry leaf litter and patchy grass";
  }

  if (/rock|cliff|scree/.test(normalized)) {
    return "stable rocky ground with sparse grass";
  }

  if (/marsh|swamp|wetland|mud/.test(normalized)) {
    return "firm wet ground with reeds";
  }

  return "firm grass-covered ground with no loose soil";
}

function buildSceneLockLighting(cleanLighting: string, weather: Weather, cleanEnv: string): string {
  const normalized = normalizeSceneText(`${cleanLighting} ${cleanEnv}`);
  const winterLike = /snow|frozen|winter|ice/.test(normalized);

  switch (weather) {
    case "Golden Hour":
      return winterLike ? "cold late-day winter light" : "warm late-day golden light";
    case "Storm":
      return "storm-dark filtered daylight";
    case "Overcast":
      return winterLike ? "cold overcast afternoon light" : "soft cloudy daylight";
    case "Dawn":
      return /cloud|overcast|diffuse/.test(normalized)
        ? "soft cloudy dawn light"
        : "cold dawn light";
    case "Midday Heat":
      return "hard midday sun";
    case "Winter Blizzard":
      return "cold overcast afternoon light";
    case "Frozen Dusk":
      return "winter dusk with a purple-orange sky";
    default:
      return /golden|backlight|rim light/.test(normalized)
        ? "warm late-day golden light"
        : /overcast|cloud|diffuse/.test(normalized)
          ? "soft cloudy daylight"
          : /dawn|blue hour|first light/.test(normalized)
            ? "cold dawn light"
            : "natural documentary daylight";
  }
}

function buildSceneLockLightingAccent(cleanLighting: string): string {
  const normalized = normalizeSceneText(cleanLighting);
  const accents: string[] = [];

  if (/hard side light/.test(normalized)) {
    accents.push("hard side light");
  } else if (/side light/.test(normalized)) {
    accents.push("side light");
  }

  if (/cool rim light/.test(normalized)) {
    accents.push("cool rim light");
  } else if (/rim light/.test(normalized)) {
    accents.push("rim light");
  } else if (/backlight/.test(normalized)) {
    accents.push("backlight");
  }

  if (!accents.length) {
    return "";
  }

  return accents.length === 1
    ? `Keep the light direction ${accents[0]}.`
    : `Keep the light direction ${accents[0]} with ${accents[1]}.`;
}

function buildSceneLockAtmosphere(
  cleanEnv: string,
  weather: Weather,
  habitatMode: ReturnType<typeof getHabitatMode>,
  isWaterForwardStrike: boolean
): string {
  const normalized = normalizeSceneText(cleanEnv);

  if (habitatMode === "aquatic") {
    return "clean moving water and a readable surface break";
  }

  if (habitatMode === "shoreline") {
    return isWaterForwardStrike
      ? "clean shoreline air and a tight surface-break window"
      : "clean shoreline air with light water movement";
  }

  if (weather === "Storm") {
    return "storm-heavy air with distant cloud build";
  }

  if (weather === "Winter Blizzard") {
    return "cold snowfall held low in clear readable layers";
  }

  if (weather === "Frozen Dusk" || /snow|frozen|winter/.test(normalized)) {
    return "clear cold air";
  }

  if (weather === "Dawn") {
    return "cool clear morning air";
  }

  if (/forest|pine|aspen|woodland/.test(normalized)) {
    return "clean forest air";
  }

  return "clear open air";
}

function buildSceneLockState(
  cleanEnv: string,
  cleanLighting: string,
  weather: Weather,
  habitatMode: ReturnType<typeof getHabitatMode>,
  isWaterForwardStrike: boolean
): SceneLockState {
  const habitat = buildSceneLockHabitat(cleanEnv);

  return {
    ...habitat,
    groundState: buildSceneLockGround(cleanEnv, weather, habitatMode, isWaterForwardStrike),
    lightingFamily: buildSceneLockLighting(cleanLighting, weather, cleanEnv),
    atmosphereFamily: buildSceneLockAtmosphere(
      cleanEnv,
      weather,
      habitatMode,
      isWaterForwardStrike
    ),
  };
}

function buildSceneNoteBlockingCue(
  sanitizedSceneDesc: string,
  predator: string,
  prey: string,
  habitatMode: ReturnType<typeof getHabitatMode>,
  isWaterForwardStrike: boolean,
  isRutMirrorMatch: boolean,
  rutCue: ReturnType<typeof getRutMirrorMatchCue>
): string {
  if (!sanitizedSceneDesc) return "";

  const normalized = normalizeSceneText(sanitizedSceneDesc);

  if (/\bleft\b/.test(normalized) && /\bright\b/.test(normalized)) {
    return clipPromptContext(sanitizedSceneDesc, 110);
  }

  if (isRutMirrorMatch && /(standoff|square off|antler|claim|shoulder|footing)/.test(normalized)) {
    return `Keep the standoff frontal with ${rutCue.room} and planted footing.`;
  }

  if (
    (habitatMode === "shoreline" || isWaterForwardStrike) &&
    /(bank|waterline|surface|shallows?|strike|shoreline)/.test(normalized)
  ) {
    return "Keep the bank edge open, the shoreline gap clean, and the surface-break lane readable.";
  }

  if (/(advance|closing|close|pressure|spacing|turn|breakaway|step|hold)/.test(normalized)) {
    return `Let ${predator} own one readable advance while ${prey} keeps a clean reaction lane.`;
  }

  return "";
}

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
  weather: Weather,
  quality?: QualityOptions,
  cameraAnglePreset: CameraAnglePreset = "Auto"
): string {
  const vibe = animalVibePrompt[animalVibe];

  const isWaterForwardStrike = isWaterForwardPreyScenario(predator, prey, cleanEnv);
  const isRutMirrorMatch = isRutMirrorMatchScenario(predator, prey, arc, cleanEnv);
  const rutCue = getRutMirrorMatchCue(predator);
  const sceneLock = buildSceneLockState(
    cleanEnv,
    cleanLighting,
    weather,
    habitatMode,
    isWaterForwardStrike
  );

  const subjectLine = isRutMirrorMatch
    ? `Two ${predator} rivals share one frame ${sceneLock.habitatLocation} during a rut standoff on ${sceneLock.groundState}.`
    : `${predator} and ${prey} share one frame ${sceneLock.habitatLocation} during a high-tension ${getSafeArcLabel(arc)} beat on ${sceneLock.groundState}.`;

  const baseBlockingLine = isRutMirrorMatch
    ? `Keep one ${predator} planted on the left and the other on the right with ${rutCue.room}, a clean frontal antler line, and open claim-space between them.`
    : habitatMode === "aquatic"
      ? `Keep ${predator} on the left and ${prey} on the right with one clean water lane between them while both bodies stay fully readable.`
      : habitatMode === "shoreline"
        ? isWaterForwardStrike
          ? `Keep ${predator} low on the left at the bank and ${prey} on the right inside the shallow strike window with one open reaction lane between them.`
          : `Keep ${predator} low on the left at the waterline and ${prey} on the right with one open shoreline lane between them.`
        : `Keep ${predator} on the left and ${prey} on the right with one open reaction lane between them and both bodies fully readable.`;

  const sceneNoteCue = buildSceneNoteBlockingCue(
    sanitizedSceneDesc,
    predator,
    prey,
    habitatMode,
    isWaterForwardStrike,
    isRutMirrorMatch,
    rutCue
  );
  const blockingLine = sceneNoteCue ? `${baseBlockingLine} ${sceneNoteCue}` : baseBlockingLine;

  const compositionBase = isRutMirrorMatch
    ? `Wide 9:16 documentary framing keeps both rivals fully visible, clash geometry clean, and ${rutCue.room} preserved.`
    : `Wide 9:16 documentary framing keeps both animals fully visible with clean first-frame spacing.`;
  const depthLine =
    depth.lensNote === "cinematic telephoto depth separation"
      ? "Telephoto compression keeps the subjects separated."
      : depth.lensNote === "balanced documentary depth"
        ? "Telephoto framing keeps the midground readable."
        : "The habitat stays readable behind them.";
  const cameraPresetLine = buildImageCameraPresetLine(
    cameraAnglePreset,
    habitatMode,
    cleanEnv
  );
  const compositionLine = `${compositionBase}${cameraPresetLine ? ` ${cameraPresetLine}` : ""} ${depthLine}`;

  const lightingAccentLine = buildSceneLockLightingAccent(cleanLighting);
  const cameraLightingLine = buildCameraLightingContinuityLine(
    cameraAnglePreset,
    habitatMode,
    cleanEnv
  );
  const atmosphereLine = `${sceneLock.lightingFamily} in ${sceneLock.atmosphereFamily}.${lightingAccentLine ? ` ${lightingAccentLine}` : ""}${cameraLightingLine ? ` ${cameraLightingLine}` : ""}`;

  const anatomyLine =
    quality?.realismMode === "High Naturalism"
      ? "Keep anatomy exact, coat markings stable, clean grounded paw or hoof contact visible, and natural wear intact."
      : quality?.realismMode === "Reference Locked"
        ? "Keep anatomy exact, coat markings stable, and clean grounded paw or hoof contact visible."
        : "Keep anatomy exact, coat markings stable, and body mechanics natural.";

  const detailLine = vibe.texture
  ? `Photoreal wildlife documentary detail with ${cleanTexture} and ${vibe.texture.toLowerCase()}. ${anatomyLine} ${CLEAN_GROUND_CONTACT_LINE} Avoid: ${DUST_FREE_NEGATIVE_TERMS}.`
  : `Photoreal wildlife documentary detail with ${cleanTexture}. ${anatomyLine} ${CLEAN_GROUND_CONTACT_LINE} Avoid: ${DUST_FREE_NEGATIVE_TERMS}.`;

  return `${subjectLine} ${blockingLine} ${compositionLine} ${atmosphereLine} ${detailLine}`;
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
  target: ImagePromptTarget = "NANO_BANANA_2",
  cameraAnglePreset: CameraAnglePreset = "Auto"
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
      weather,
      quality,
      cameraAnglePreset
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
  target: ImagePromptTarget = "NANO_BANANA_2",
  cameraAnglePreset: CameraAnglePreset = "Auto"
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
    target,
    cameraAnglePreset
  ).fullText;
}

export function buildShotImagePlan(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  quality?: QualityOptions,
  cameraAnglePreset: CameraAnglePreset = "Auto"
): ShotImagePlan[] {
  const habitatMode = getHabitatMode(predator, prey, env);
  const cleanEnv = sanitizeImageEnv(env);
  const cleanWeather = sanitizeWeatherPhrase(weatherVariants[weather]);
  const micro = buildMicroMotionLine(weather, env);
  const isWaterForwardStrike = isWaterForwardPreyScenario(predator, prey, env);
  const isRutMirrorMatch = isRutMirrorMatchScenario(predator, prey, arc, env);
  const rutCue = getRutMirrorMatchCue(predator);
  const cameraPresetLine = buildImageCameraPresetLine(
    cameraAnglePreset,
    habitatMode,
    env
  );
  const cameraLine = cameraPresetLine ? `${cameraPresetLine} ` : "";
  const gateOn = !!quality?.singleActionRule;

  const action = oneActionArcBeat(arc, "action", gateOn, habitatMode);
  const aftermath = oneActionArcBeat(arc, "aftermath", gateOn, habitatMode);

  const openingPredator =
    isRutMirrorMatch
      ? `holds the ${rutCue.line} on the left with ${rutCue.room}`
      : habitatMode === "aquatic"
        ? "holds controlled pressure through the water on the left"
        : habitatMode === "shoreline"
          ? isWaterForwardStrike
            ? "holds low at the bank on the left with the shallow strike window visible"
            : "holds low visible pressure at the waterline on the left"
          : "holds readable pre-action pressure on the left";

  const openingPrey =
    isRutMirrorMatch
      ? "answers on the right with matching shoulder tension and planted footing"
      : isWaterForwardStrike
        ? "shows a tense near-surface hold on the right inside the bank-edge current"
        : habitatMode === "shoreline"
          ? "stays fully alert near the bank on the right"
          : "stays fully alert and reactive on the right";

  const pressurePredator =
    isRutMirrorMatch
      ? `edges forward with heavier shoulder-line pressure while keeping ${rutCue.room}`
      : habitatMode === "aquatic"
        ? "leans into stronger forward water pressure without breaking spacing"
        : habitatMode === "shoreline"
          ? isWaterForwardStrike
            ? "leans farther forward from the bank as the shallow strike window tightens"
            : "leans farther forward from the bank with stronger visible ambush pressure"
          : "leans farther forward with stronger visible pressure";

  const pressurePrey =
    isRutMirrorMatch
      ? "braces into one grounded footing reset without giving away the claim line"
      : habitatMode === "aquatic"
        ? "makes one tighter defensive adjustment in the current"
        : habitatMode === "shoreline"
          ? isWaterForwardStrike
            ? "breaks the surface once near the bank and stays tight to the shoreline current"
            : "lowers into one readable defensive footing adjustment near the bank"
          : "lowers into one readable defensive adjustment";

  const peakPredator = sanitizeVideoBeatText(action.predatorBeat);
  const peakPrey = sanitizeVideoBeatText(action.preyBeat);
  const resolvePredator = sanitizeVideoBeatText(aftermath.predatorBeat);
  const resolvePrey = sanitizeVideoBeatText(aftermath.preyBeat);
  const peakContinuityLine = isRutMirrorMatch
    ? ` Keep ${rutCue.room}, planted footing, and heavy shoulder alignment readable through the clash geometry.`
    : isWaterForwardStrike
      ? " Keep the bank-edge strike window, surface break, and shoreline reaction natural through the action beat."
      : "";
  const resolveContinuityLine = isRutMirrorMatch
    ? ` Let the ${rutCue.line} and claim-space read stay visible as the standoff resets.`
    : isWaterForwardStrike
      ? " Let the bank-edge water reaction settle while shoreline spacing stays clean."
      : "";

  const continuityLock = `Keep ${predator} and ${prey} identical in anatomy, markings, scale, lighting family, and habitat continuity in ${cleanEnv}, ${cleanWeather}. Preserve the same 9:16 documentary image family, grounded contact, realistic spacing, clean silhouette separation, and dust-free ground contact.`;
  const atmosphereLock = `Environment stays continuity-safe with ${micro}. ${CLEAN_GROUND_CONTACT_LINE}`;
  const shotWorldContinuityLock = buildShotWorldContinuityLock("image");
  const masterBase =
    "Base image: use the Nano Banana 2 / Gemini master still as the Shot 1 visual-world anchor.";
  const continuityBase =
    "Base image: use the previous continuity image derived from the Nano Banana master still.";

  return [
    {
      title: "Shot 1 Image — Opening Tension",
      source: "master",
      prompt: finalizePrompt(
        `${masterBase} ${continuityLock} ${cameraLine}Reframe into a wide opening shot with both subjects fully readable from frame one. The ${predator} ${openingPredator}. The ${prey} ${openingPrey}. Keep the existing style and composition family intact. ${atmosphereLock}`
      ),
    },
    {
      title: "Shot 2 Image — Pressure Build",
      source: "previous_image",
      prompt: finalizePrompt(
        `${continuityBase} ${continuityLock} Tighten the frame slightly for the pressure-build beat. The ${predator} ${pressurePredator}. The ${prey} ${pressurePrey}. ${shotWorldContinuityLock} ${atmosphereLock}`
      ),
    },
    {
      title: "Shot 3 Image — Peak Action",
      source: "previous_image",
      prompt: finalizePrompt(
        `${continuityBase} ${continuityLock} Advance into the peak action beat with one dominant readable action. The ${predator} ${peakPredator}. The ${prey} ${peakPrey}. Preserve full-body readability, clear predator-to-prey spacing, believable traction, and strong biomechanical clarity.${peakContinuityLine} ${shotWorldContinuityLock} ${atmosphereLock}`
      ),
    },
    {
      title: "Shot 4 Image — Resolved Tension",
      source: "previous_image",
      prompt: finalizePrompt(
        `${continuityBase} ${continuityLock} Move into the immediate aftermath or resolved tension beat. The ${predator} ${resolvePredator}. The ${prey} ${resolvePrey}. Preserve readable spacing to the final frame, stable anatomy, and clean continuity.${resolveContinuityLine} ${shotWorldContinuityLock} ${atmosphereLock}`
      ),
    },
  ];
}

export function buildNegativePrompt(
  predator: string,
  engine: "KLING" | "RUNWAY" | "SEEDANCE" = "KLING"
): string {
  if (engine !== "KLING") {
    return DUST_FREE_NEGATIVE_TERMS;
  }

  const base =
    "cartoon, CGI look, anime style, illustration, game render, unnatural motion, morphing artifacts, " +
    "split screen, floating limbs, jerky movement, watermark, text overlay, subtitle burn-in, " +
    "extra limbs, extra tails, extra heads, duplicate animals, wrong animal count, merged bodies, " +
    "partial body crop, cut-off paws, cut-off hooves, cut-off tails, hidden subjects, overlapping bodies, " +
    "close-up crop, off-frame subject, face distortion, warping, melting anatomy, inconsistent physics, " +
    "background shifting, changing markings, deformed anatomy, plastic fur, oversharpened HDR, synthetic glow, " +
    "fire, flame, fantasy breath, glowing mouth, energy effect, light beam, smoke plume, steam, mist, haze, fog wall, " +
    `${DUST_FREE_NEGATIVE_TERMS}, bright unnatural colors`;

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
    "clear clean air, no visible steam, no smoke plumes, no mist, no airborne haze, no dust clouds, no kicked-up soil";

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
