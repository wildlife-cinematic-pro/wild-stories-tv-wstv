import type {
  Arc,
  DepthMode,
  Weather,
  QualityOptions,
  PredatorInfo,
  StructuredPrompt,
} from "@/types";

import { weatherVariants } from "@/lib/predator-data";
import { arcs, weatherOptions } from "@/lib/model-specs";
import { buildQualityLead } from "@/lib/quality-lead";

import {
  getHabitatMode,
  buildMicroMotionLine,
  getSafeArcPrint,
  isWaterForwardPreyScenario,
} from "@/lib/prompt-builders/habitat";
import {
  finalizePrompt,
  sanitizeSocialCopyText,
  sanitizeImageEnv,
  sanitizeWeatherPhrase,
} from "@/lib/prompt-builders/sanitizers";

export { buildQualityLead };

export const RUNWAY_SPECS = {
  fpsOptions: [24, 25] as const,
  durationRange: { min: 2, max: 10 } as const,
  outputRes: "720p (built-in 4K upscale available)" as const,
  negativePromptSupport: false,
  i2vRule: "MOTION-ONLY: Image carries identity; prompt describes movement, camera, physics only.",
  promptStructure: "[Camera] [subject] [action] in [environment]. [Supporting details]",
  sequentialPrompting: true,
  timestampSupport: true,
  chainingMethod:
    "Use last-frame chaining only when the outgoing frame is a clean full-body handoff frame. Otherwise reuse the master still or a manually selected clean frame.",
} as const;

export const KLING_SPECS = {
  resolution: "Native 4K (3840×2160)" as const,
  fpsMax: 60 as const,
  durationRange: { min: 3, max: 15 } as const,
  maxShots: 6 as const,
  nativeAudio: true,
  negativePromptSupport: true,
  elementsVersion: "3.0 (Bind Subject)" as const,
  startEndFrameControl: true,
  guidanceScaleRange: { min: 0.0, max: 1.0 } as const,
  motionIntensityRange: { min: 0.1, max: 1.0 } as const,
  promptFramework:
    "Director-style narrative paste block for direct use, with structured Shot / Character / Action / Lighting / Extra breakdown kept for reference",
  multiPromptSystem: true,
  omniMode: true,
} as const;

export function getKlingMotionIntensity(
  arc: Arc,
  beat: "establish" | "action" | "aftermath"
): number {
  const baseByArc: Record<string, number> = {
    "Chase and takedown": 0.7,
    "Ambush attack": 0.65,
    "Escape from danger": 0.7,
    "Territory dominance battle": 0.55,
    "Predator vs predator fight": 0.65,
    "Pack hunting strategy": 0.6,
    "Defender stands ground": 0.5,
    "Giant vs giant clash": 0.6,
  };

  const base = baseByArc[arc] ?? 0.55;

  switch (beat) {
    case "establish":
      return Math.max(0.1, base - 0.25);
    case "action":
      return Math.min(1.0, base + 0.15);
    case "aftermath":
      return Math.max(0.1, base - 0.2);
    default:
      return base;
  }
}

export function buildKlingCharacterLine(
  predator: string,
  prey: string,
  motionOnlyI2V?: boolean
): string {
  return motionOnlyI2V
    ? `Characters: same ${predator} identity from input frame; same ${prey} identity from input frame.`
    : `Characters: ${predator} (predator — drives scene pressure); ${prey} (prey — fully alert and reactive).`;
}

export function buildKlingLocationLine(
  env: string,
  weather: Weather,
  motionOnlyI2V?: boolean
): string {
  const cleanEnv = sanitizeImageEnv(env);
  const cleanWeather = sanitizeWeatherPhrase(weatherVariants[weather]);

  return motionOnlyI2V
    ? `Lighting & Location: Preserve the input-frame terrain and light continuity, ${cleanWeather}.`
    : `Lighting & Location: ${cleanEnv}, ${cleanWeather}.`;
}

export function buildShotWorldContinuityLock(
  engine: "image" | "runway" | "kling" | "seedance"
): string {
  const lock =
    "preserve the Shot 1 world plate: same background layout, terrain contours, horizon line, key tree/reed/rock placement, light direction, weather density, and habitat identity; keep the environment anchored while only the action beat and camera move change";

  if (engine === "image") {
    return "Preserve the Shot 1 world plate: same background layout, terrain contours, horizon line, key tree/reed/rock placement, light direction, weather density, and habitat identity. Keep the environment anchored while only the action beat and framing change.";
  }

  if (engine === "runway") {
    return `Continuity lock: ${lock}.`;
  }

  if (engine === "seedance") {
    return "Stay inside the exact Shot 1 world plate: same background layout, terrain contours, horizon line, key tree/reed/rock placement, light direction, weather density, and habitat identity. Keep the environment anchored while only the action beat and camera move change.";
  }

  return "Continue inside the exact Shot 1 world plate: same background layout, terrain contours, horizon line, key tree/reed/rock placement, light direction, weather density, and habitat identity. Keep the environment anchored while only the action beat and camera move change.";
}

export function buildKlingExtraLine(base: string, motionOnlyI2V?: boolean): string {
  return motionOnlyI2V ? base : `${base}.`;
}

export function formatActionSubject(subject: string, beat: string): string {
  if (subject === "Wolf Pack") {
    return `The pack ${beat}`;
  }
  return `${subject} ${beat}`;
}

/**
 * Anchors a left/right subject reference with the explicit animal identity while
 * preserving the side-position logic used for multi-subject motion clarity.
 */
export function buildAnchoredSideSubject(
  subject: string | undefined,
  side: "left" | "right",
  beat: string
): string {
  const cleanSubject = subject?.trim() ?? "";
  const cleanBeat = beat.trim();

  if (!cleanSubject) {
    return `The ${side} subject ${cleanBeat}`.trim();
  }

  if (!cleanBeat) {
    return `${cleanSubject} (${side})`;
  }

  const loweredSubject = cleanSubject.toLowerCase();
  const loweredBeat = cleanBeat.toLowerCase();

  if (loweredBeat.startsWith(loweredSubject)) {
    const remainder = cleanBeat.slice(cleanSubject.length).trimStart();
    return remainder ? `${cleanSubject} (${side}) ${remainder}` : `${cleanSubject} (${side})`;
  }

  return `${cleanSubject} (${side}) ${cleanBeat}`;
}

export function klingWidePhysicsRule(): string {
  return "WIDE PHYSICS RULE — Shot 2 and Shot 3 must be FIXED WIDE (full bodies visible) to preserve biomechanics, weight transfer, and collision readability. Kling 3.0's 4K output ensures micro-detail even in wide framing.";
}

export function maybeGuard(line: string): string {
  return line ? `${line}\n` : "";
}

export function getDepthPrompt(mode: DepthMode): { depth: string; lensNote: string } {
  if (mode === "Cinematic Blur") {
    return {
      depth: "shallow depth of field, strong subject separation, soft natural background blur",
      lensNote: "cinematic telephoto depth separation",
    };
  }
  if (mode === "Balanced Depth") {
    return {
      depth: "moderate depth of field, clear subject separation, readable midground, slightly soft distant background",
      lensNote: "balanced documentary depth",
    };
  }

  return {
    depth: "deeper depth of field, detailed readable background, clear habitat structure",
    lensNote: "documentary clarity preserved",
  };
}

export function buildKlingAudioPrompt(
  predator: string,
  prey: string,
  env: string,
  weather: Weather,
  arc: Arc,
  beat: "establish" | "action" | "aftermath"
): string {
  void arc;
  const envLower = env.toLowerCase();
  const habitatMode = getHabitatMode(predator, prey, env);
  const isAquatic = habitatMode === "aquatic";
  const isShoreline = habitatMode === "shoreline";
  const isWaterForwardStrike = isWaterForwardPreyScenario(predator, prey, env);

  const isArcticLike =
    envLower.includes("arctic") ||
    envLower.includes("snow") ||
    envLower.includes("tundra") ||
    envLower.includes("ice") ||
    envLower.includes("glacier") ||
    envLower.includes("frozen") ||
    envLower.includes("winter");

  let ambient = "distant natural ambience, wind through terrain";

  if (isAquatic) {
    ambient = "moving water, current wash, surface ripples, underwater ambience";
  } else if (isShoreline) {
    ambient = "lapping shoreline water, shallow splash movement, muddy bank disturbance, open wetland ambience";
  } else if (envLower.includes("forest") || envLower.includes("jungle")) {
    ambient = isArcticLike
      ? "cold mountain wind through pines, distant winter forest hush, snow underfoot atmosphere"
      : "distant bird calls, rustling canopy, layered forest ambience";
  } else if (envLower.includes("savanna") || envLower.includes("grassland")) {
    ambient = "dry wind sweeping grass, distant insect drone, open-plain ambience";
  } else if (envLower.includes("arctic") || envLower.includes("snow") || envLower.includes("tundra")) {
    ambient = "howling arctic wind, crunching ice surface, stark frozen silence";
  } else if (envLower.includes("mountain") || envLower.includes("cliff")) {
    ambient = isArcticLike
      ? "cold alpine wind, distant frozen forest hush, brittle snow atmosphere"
      : "mountain wind, distant rockfall echoes, alpine silence";
  } else if (envLower.includes("desert")) {
    ambient = "desert wind whisper, sand grain movement, dry heat stillness";
  }

  let weatherAudio = "";

  if (isAquatic) {
    if (weather === "Storm") weatherAudio = ", turbulent surface chop, wave impact, current surge";
    else if (weather === "Winter Blizzard") weatherAudio = ", icy surface disturbance, freezing wind over water";
    else if (weather === "Frozen Dusk") weatherAudio = ", cold still water ambience, crystalline surface movement";
    else if (weather === "Golden Hour") weatherAudio = ", warm surface wash, gentle wave rhythm, reflective water stillness";
  } else if (isShoreline) {
    if (weather === "Storm") weatherAudio = ", choppy shallows, splashing bank wash, wind over wet ground";
    else if (weather === "Golden Hour") weatherAudio = ", warm shoreline wash, gentle shallows movement, reflective water stillness";
    else if (weather === "Frozen Dusk") weatherAudio = ", cold shoreline stillness, brittle wet-ground atmosphere";
    else if (weather === "Winter Blizzard") weatherAudio = ", icy shoreline wind, freezing surface disturbance";
  } else if (isArcticLike) {
    if (weather === "Storm") weatherAudio = ", harsh wind pressure, distant ice crack, frozen surface disturbance";
    else if (weather === "Winter Blizzard") weatherAudio = ", fierce blizzard wind, snow pelting surfaces";
    else if (weather === "Frozen Dusk") weatherAudio = ", eerie frozen silence, crystalline wind";
    else if (weather === "Golden Hour") weatherAudio = ", brittle snow hush, faint icy wind through pines, drifting snow crystals, distant frozen forest stillness";
  } else {
    if (weather === "Storm") weatherAudio = ", rolling thunder in distance, rain striking foliage";
    else if (weather === "Winter Blizzard") weatherAudio = ", fierce blizzard wind, snow pelting surfaces";
    else if (weather === "Frozen Dusk") weatherAudio = ", eerie frozen silence, crystalline wind";
    else if (weather === "Golden Hour") weatherAudio = ", warm twilight stillness, evening insect chorus";
  }

  let animalAudio = "";
  switch (beat) {
    case "establish":
      animalAudio = isAquatic
        ? `${predator} controlled body movement through water, subtle fin or tail displacement, ${prey} tense reactive movement in the current`
        : isShoreline
          ? isWaterForwardStrike
            ? `${predator} restrained low movement at the bank edge, subtle body pressure over the shallows, ${prey} tense near-surface hold inside the strike window`
            : `${predator} restrained low movement at the water's edge, subtle body pressure in the shallows, ${prey} tense footing adjustment near the bank`
          : `${predator} slow controlled breathing through nostrils, ${prey} alert stillness with occasional tension exhale`;
      break;
    case "action":
      animalAudio = isAquatic
        ? `${predator} explosive water displacement, rapid current turbulence, ${prey} frantic splash or dart movement, bubble and spray burst`
        : isShoreline
          ? isWaterForwardStrike
            ? `${predator} explosive bank-edge strike, shallow splash burst, surface break, ${prey} frantic dart and turn through the shoreline current`
            : `${predator} explosive surge from the shoreline, shallow splash burst, mud scatter, ${prey} frantic leap or turn on unstable ground`
          : `heavy ground impact from ${predator} movement, explosive burst sounds, ${prey} distress vocalization, debris scatter`;
      break;
    case "aftermath":
      animalAudio = isAquatic
        ? `${predator} slower water movement settling, residual turbulence fading, ${prey} cautious repositioning through the water`
        : isShoreline
          ? isWaterForwardStrike
            ? `${predator} slower bank-edge movement settling, residual splash fading, ${prey} cautious repositioning through the near-surface current`
            : `${predator} slower edge movement settling, residual splash fading, ${prey} cautious repositioning on wet unstable ground`
          : `${predator} heavy rhythmic breathing settling, terrain debris settling, ${prey} cautious repositioning footsteps`;
      break;
  }

  return finalizePrompt(
    `Audio: ${ambient}${weatherAudio}. ${animalAudio}. No music. Documentary field recording quality.`
  );
}

export function buildKlingAudioShort(
  predator: string,
  prey: string,
  env: string,
  weather: Weather,
  beat: "establish" | "action" | "aftermath"
): string {
  const habitatMode = getHabitatMode(predator, prey, env);
  const isAquatic = habitatMode === "aquatic";
  const isShoreline = habitatMode === "shoreline";
  const isWaterForwardStrike = isWaterForwardPreyScenario(predator, prey, env);
  const envLower = env.toLowerCase();

  const isArcticLike =
    envLower.includes("arctic") ||
    envLower.includes("snow") ||
    envLower.includes("tundra") ||
    envLower.includes("ice") ||
    envLower.includes("glacier") ||
    envLower.includes("frozen") ||
    envLower.includes("winter");

  const weatherTag =
    weather === "Winter Blizzard"
      ? "blizzard wind, snow surfaces"
      : weather === "Storm"
        ? "storm wind, rain"
        : weather === "Golden Hour"
          ? "warm twilight stillness"
          : weather === "Frozen Dusk"
            ? "frozen silence, crystalline wind"
            : "ambient wind";

  const ambientTag =
    isAquatic
      ? "water current, surface movement"
      : isShoreline
        ? "shoreline wash, wet bank"
        : isArcticLike
          ? "arctic wind, frozen ground"
          : envLower.includes("forest")
            ? "forest ambience, canopy"
            : envLower.includes("savanna") || envLower.includes("grassland")
              ? "dry wind, insect drone"
              : "terrain ambience";

  const animalTag =
    beat === "establish"
      ? isWaterForwardStrike
        ? `${predator} bank-edge hold, ${prey} near-surface tension`
        : `${predator} controlled breathing, ${prey} alert stillness`
      : beat === "action"
        ? isWaterForwardStrike
          ? `${predator} strike burst, ${prey} surface-break dart, shoreline splash`
          : `${predator} impact, ${prey} distress vocalization, debris`
        : isWaterForwardStrike
          ? `${predator} settling at the bank edge, ${prey} cautious current repositioning`
          : `${predator} breathing settling, ${prey} cautious repositioning`;

  return finalizePrompt(`Audio: ${ambientTag}, ${weatherTag}. ${animalTag}. No music.`);
}

export function buildQualitySummary(opts: QualityOptions): string {
  return finalizePrompt(
    [
      `Realism mode: ${opts.realismMode}.`,
      opts.referenceLock
        ? "Reference-locked workflow keeps the same animal face, markings, body proportions, and silhouette readability across clips."
        : "Reference lock disabled — use only if you intentionally want variation.",
      opts.motionOnlyI2V
        ? "Video prompts stay motion-led so the engines preserve the source image identity and first-frame readability."
        : "Video prompts may be more descriptive, which can increase drift and weaken subject clarity.",
      opts.singleActionRule
        ? "Single-action prompting is active to reduce melting, tearing, chaotic physics, and unreadable overlap."
        : "Multi-action prompting can reduce clarity and motion coherence.",
      opts.microMotion
        ? "Environmental micro-motion is active to avoid static-scene syndrome while keeping the opening readable."
        : "Background movement is minimal.",
      opts.heroVeo
        ? "Veo hero mode is active for the most realism-sensitive beats."
        : "Veo hero mode is off.",
    ].join(" ")
  );
}

export function buildReferenceWorkflow(predator: string, opts: QualityOptions): string {
  const realismNote =
    opts.realismMode === "Reference Locked"
      ? "Use a clean, evenly lit master still with readable silhouette, strong first-frame readability, and clear foreground/background separation."
      : opts.realismMode === "High Naturalism"
        ? "Use a gritty still with real dirt, moisture, stray hairs, believable contact shadows, and clear subject readability."
        : "Use a balanced hero still with strong separation, stable anatomy, and immediate subject clarity.";

  return finalizePrompt(`REFERENCE LOCK WORKFLOW — ${predator.toUpperCase()}
${realismNote}
STEP 1 — Generate one master image first.
STEP 2 — Keep the opening frame readable: clear silhouette, visible tension, strong subject separation, no empty dead space.
STEP 3 — Use that exact image as the reference or first frame for every video clip.
  • Runway: Upload as I2V input. Prompt = motion only.
  • Kling 3.0: Upload as reference + enable "Bind Subject" (Elements 3.0).
STEP 4 — Keep video prompts focused on motion only: subject action, environment motion, camera motion.
STEP 5 — Change only one main motion beat per shot to preserve identity, anatomy, and spacing.
STEP 6 — If drift appears:
  • Runway: Use the previous last frame only if it remains a clean full-body handoff frame. Otherwise reuse the master still or a manually selected clean frame as the new I2V input.
  • Kling: Use the previous last frame only if it remains a clean full-body handoff frame. Otherwise re-upload the master still or a manually selected clean frame with Bind Subject enabled.
STEP 7 — For Kling 3.0: Optionally set End Frame to guide the final tension pose.`);
}

export function buildNaturalismChecklist(
  opts: QualityOptions,
  weather: Weather,
  env: string
): string[] {
  return [
    opts.realismMode === "High Naturalism" || opts.realismMode === "Reference Locked"
      ? "Inject biological imperfections: stray hairs, dirt, uneven fur breakup, paw pressure, moisture, asymmetry, while keeping anatomy clean and readable."
      : "Keep textures clean but not plastic.",
    `Keep one undeniable light direction so motion engines preserve form, shadow logic, and first-frame readability in ${weather.toLowerCase()} conditions.`,
    `Use environmental motion such as ${buildMicroMotionLine(weather, env)} without obscuring subject visibility.`,
    opts.motionOnlyI2V
      ? "Runway: do not restate animal appearance in I2V prompts. Kling: keep appearance text extremely short so identity and opening-frame readability stay stable."
      : "If you describe appearance in video, keep it extremely short and subordinate to motion clarity.",
    opts.singleActionRule
      ? "One subject action plus one camera move per shot only. Keep spacing readable and avoid overlap."
      : "Avoid more than two simultaneous motion beats or the scene can lose clarity.",
    opts.referenceLock
      ? "Reuse the master frame by default, or chain from the previous last frame only when it remains a clean full-body handoff frame, to preserve silhouette, spacing, and subject readability across clips."
      : "Expect more visual variation and weaker identity stability without reference lock.",
  ].map(finalizePrompt);
}

export type FourShotPromptPack<T = StructuredPrompt> = {
  shot1: T;
  shot2: T;
  shot3: T;
  shot4: T;
};

export function buildStructuredPrompt(prompt: StructuredPrompt): StructuredPrompt {
  return {
    ...prompt,
    fullText: finalizePrompt(prompt.fullText),
    pasteReady: finalizePrompt(prompt.pasteReady),
    audio: prompt.audio ? finalizePrompt(prompt.audio) : undefined,
    settings: prompt.settings?.map(finalizePrompt).filter(Boolean),
  };
}

export function promptPackToLegacyText(
  pack: FourShotPromptPack<StructuredPrompt>
): FourShotPromptPack<string> {
  return {
    shot1: pack.shot1.fullText,
    shot2: pack.shot2.fullText,
    shot3: pack.shot3.fullText,
    shot4: pack.shot4.fullText,
  };
}

export function promptPackToArray(pack: FourShotPromptPack<StructuredPrompt>): StructuredPrompt[] {
  return [pack.shot1, pack.shot2, pack.shot3, pack.shot4];
}

export function build10Ideas(predator: string, preyList: string[], preset: PredatorInfo): string[] {
  const ideas: string[] = [];
  const seen = new Set<string>();

  const add = (idea: string) => {
    const safe = sanitizeSocialCopyText(idea);
    if (!seen.has(safe) && ideas.length < 10) {
      seen.add(safe);
      ideas.push(safe);
    }
  };

  preyList.forEach((prey) =>
    add(`${predator} vs ${prey} — ${getSafeArcPrint(preset.defaultArc)} in ${preset.environment}`)
  );

  for (const a of arcs) {
    for (const p of preyList) {
      add(`${predator} vs ${p} — ${getSafeArcPrint(a)} in ${preset.environment}`);
    }
  }

  for (const w of weatherOptions) {
    for (const p of preyList) {
      add(`${predator} vs ${p} — ${getSafeArcPrint(preset.defaultArc)} during ${w} in ${preset.environment}`);
    }
  }

  const firstPrey = preyList[0] ?? "survival animal";
  const lastPrey = preyList[preyList.length - 1] ?? "survival animal";

  [
    `${predator} vs ${firstPrey} — opening tension standoff in ${preset.environment}`,
    `${predator} vs ${firstPrey} — sudden pressure beat in ${preset.environment}`,
    `${predator} vs ${lastPrey} — defensive stand in ${preset.environment}`,
    `${predator} vs ${lastPrey} — escape pressure in ${preset.environment}`,
    `${predator} vs rival ${predator} — dominance encounter in ${preset.environment}`,
  ].forEach(add);

  return ideas.slice(0, 10);
}

export function buildCapCutPlan(predator: string, arc: string, weather: Weather): string {
  return finalizePrompt(
    `CAPCUT PLAN — ${predator} | Arc: ${getSafeArcPrint(arc)} | Weather: ${weather}
1. Start on the strongest readable opening frame.
2. Keep both subjects visible as early as possible.
3. Prioritize immediate predator pressure and survival-animal reaction.
4. Avoid slow setup, empty opening space, or unclear subject visibility.
5. End on a clean high-tension or resolved-tension frame.`
  );
}

export function buildClipChaining(predator: string, driftRisk: PredatorInfo["driftRisk"]): string {
  const riskLine =
    driftRisk === "HIGH"
      ? "DRIFT HIGH — reference image on EVERY clip. Weight: 0.6–0.8."
      : driftRisk === "MEDIUM"
        ? "DRIFT MEDIUM — upload reference before each clip."
        : "DRIFT LOW — generate freely.";

  return finalizePrompt(`CLIP CHAINING — ${predator.toUpperCase()}
${riskLine}

═══ RUNWAY GEN-4.5 CHAINING (WSTV Handoff Rule) ═══
STEP 1 — Generate Shot 1 (Runway I2V) with strong first-frame readability and both subjects clearly readable.
  • If the outgoing final frame is a clean full-body handoff frame, use it as the next I2V input.
  • If readability drops, reuse the master still or manually select a clean continuity frame instead.
STEP 2 — Chain Shot 2 with the cleanest handoff source available. Prompt = motion only.
STEP 3 — Chain Shot 3 the same way. Keep end-state tension readable and spacing clear.
STEP 4 — Combine clips in a video editor. Remove repeated handoff frames if needed.

═══ KLING 3.0 CHAINING ═══
STEP 1 — Generate Shot 1 with clear opening tension and readable full-subject visibility.
STEP 2 — Use the previous last frame only when it remains a clean full-body handoff frame. Otherwise use the master still or a manually selected clean continuity frame, then enable Bind Subject.
STEP 3 — Optionally set End Frame for precise final-pose control.
STEP 4 — Alternative: use Multi-Shot mode (up to 6 shots, single prompt).

RULE: Subject description stays consistent across all clips.
RULE: Preserve predator-to-survival-animal spacing and readable silhouette separation.
RULE (Runway): Do NOT include appearance text in I2V prompts.
RULE (Kling): Use Bind Subject (Elements 3.0) for identity lock.`);
}

export type EngineWarning = {
  engine: "runway" | "kling";
  level: "error" | "warning" | "info";
  message: string;
};

export function validateEngineConstraints(opts: {
  engine: "runway" | "kling";
  duration?: number;
  fps?: number;
  hasNegativePrompt?: boolean;
  hasAppearanceInPrompt?: boolean;
}): EngineWarning[] {
  const warnings: EngineWarning[] = [];

  if (opts.engine === "runway") {
    if (opts.duration && (opts.duration < 2 || opts.duration > 10)) {
      warnings.push({
        engine: "runway",
        level: "error",
        message: `Runway Gen-4.5 duration must be 2–10 seconds. You set ${opts.duration}s.`,
      });
    }
    if (opts.fps && opts.fps !== 24 && opts.fps !== 25) {
      warnings.push({
        engine: "runway",
        level: "error",
        message: `Runway Gen-4.5 supports 24fps or 25fps only. You set ${opts.fps}fps.`,
      });
    }
    if (opts.hasNegativePrompt) {
      warnings.push({
        engine: "runway",
        level: "error",
        message: "Runway Gen-4/4.5 does not support negative prompts. Remove the negative prompt.",
      });
    }
    if (opts.hasAppearanceInPrompt) {
      warnings.push({
        engine: "runway",
        level: "warning",
        message:
          "Runway I2V: restating appearance from the image can reduce motion quality and weaken first-frame readability. Use motion-only prompts.",
      });
    }
  }

  if (opts.engine === "kling") {
    if (opts.duration && opts.duration !== 5 && opts.duration !== 10) {
      warnings.push({
        engine: "kling",
        level: "error",
        message: `Kling 3.0 generation duration must be 5s or 10s for the WSTV workflow. You set ${opts.duration}s.`,
      });
    }
    if (!opts.hasNegativePrompt) {
      warnings.push({
        engine: "kling",
        level: "info",
        message:
          "Kling 3.0 supports negative prompts. Use them to reduce drift, anatomy artifacts, overlap, and weak subject readability.",
      });
    }
  }

  return warnings;
}
