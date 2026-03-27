// ─────────────────────────────────────────────────────────────
// lib/prompt-builders.ts
// WSTV — Pure Prompt Builder Functions (Pro-Level 2026 Edition)
//
// RULES:
//   • Pure functions only — no React, no useState, no UI imports
//   • Takes plain data → returns string or object
//   • All data comes from predator-data.ts and model-specs.ts
//
// ═══════════════════════════════════════════════════════════════
// OFFICIAL ENGINE RULES (verified from official documentation)
// ═══════════════════════════════════════════════════════════════
//
// RUNWAY GEN-4.5 [Official — help.runwayml.com, Jan 2026]:
//   • FPS: 24fps / 25fps only. NEVER write "30fps" in prompts.
//   • Duration: 2–10 seconds per generation.
//   • Output: 720p native; upscale via built-in 4K button.
//   • I2V rule: Image defines composition/subjects/lighting/style.
//     Prompt describes MOTION ONLY. Do NOT restate subject appearance.
//     Reiterating image elements → reduced motion or unexpected results.
//   • NO negative prompts supported (Gen-4 / Gen-4.5).
//   • NO conversational or command-based prompts.
//   • Structure: [Camera] shot of [subject] [action] in [environment]
//   • Sequential prompting: natural language or timestamps.
//     "X occurs, then Y occurs. Finally, Z occurs."
//     Or: [00:01] X. [00:04] Y. [00:08] Z.
//   • Chaining: Extract last frame → use as I2V input for next gen.
//   • Simplicity wins. Start simple, iterate by adding detail.
//   • JSON formatting is ignored by the model.
//   • Avoid negative phrasing ("the camera doesn't move").
//   • Runway Characters feature available for consistency.
//
// KLING 3.0 [Official — Kuaishou/Kling docs, Feb 2026]:
//   • Resolution: Native 4K (3840×2160) at up to 60fps.
//   • Duration: 3–15 seconds per generation.
//   • Multi-shot: Up to 6 shots in a single prompt.
//   • Native audio: Dialogue, ambient sound, SFX, voice tone.
//   • Elements 3.0 / "Bind Subject": Lock character consistency.
//   • Start AND End frame control (new in 3.0).
//   • Negative prompts: SUPPORTED and recommended.
//   • Guidance Scale (CFG): 0.0–1.0. Higher = strict, lower = creative.
//   • Motion intensity: 0.1–1.0 values (specify for predictable results).
//   • SCALE framework: Shot → Character → Action → Lighting → Extra
//   • Cinematic intent: model understands film language natively.
//   • Omni mode: processes text, image, audio simultaneously.
//   • I2V: Image = 3D anchor (not just first frame like older models).
//   • Multi-prompt system: separate Shot Prompt per shot with duration.
//
// ─────────────────────────────────────────────────────────────

import type {
  Arc,
  DepthMode,
  Weather,
  EmotionalTone,
  AnimalVibe,
  QualityOptions,
  RunwayModel,
  KlingModel,
  PredatorInfo,
  ImagePromptTarget,
} from "@/types";

// ─── DATA IMPORTS ─────────────────────────────────────────────
import { emotionalTonePrompt, animalVibePrompt, weatherVariants } from "@/lib/predator-data";

import {
  RUNWAY_STYLE_NOTE,
  KLING_STYLE_NOTE,
  REF_TAGS,
  arcCfgScale,
  getKlingCfgScales,
  arcs,
  weatherOptions,
} from "@/lib/model-specs";

import { buildQualityLead } from "@/lib/quality-lead";
import { buildMotionBrushPlan } from "./workflow-packs";
export { buildQualityLead };

// ─────────────────────────────────────────────────────────────
// ENGINE SPEC CONSTANTS (from official docs — 2026)
// ─────────────────────────────────────────────────────────────

/** Runway Gen-4.5 official constraints */
export const RUNWAY_SPECS = {
  fpsOptions: [24, 25] as const,
  durationRange: { min: 2, max: 10 } as const,
  outputRes: "720p (built-in 4K upscale available)" as const,
  negativePromptSupport: false,
  i2vRule: "MOTION-ONLY: Image carries identity; prompt describes movement, camera, physics only.",
  promptStructure: "[Camera] [subject] [action] in [environment]. [Supporting details]",
  sequentialPrompting: true,
  timestampSupport: true,
  chainingMethod: "Extract last frame → use as I2V input for next generation.",
} as const;

/** Kling 3.0 official constraints */
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
  promptFramework: "SCALE: Shot → Character → Action → Lighting & Location → Extra",
  multiPromptSystem: true,
  omniMode: true,
} as const;

// ─────────────────────────────────────────────────────────────
// Banned-words sanitizer (platform-safe)
// ─────────────────────────────────────────────────────────────
const BANNED_WORDS: Array<[RegExp, string]> = [
  [/\btakedown\b/gi, "capture"],
  [/\bbite\b/gi, "grip"],
  [/\bmaul\b/gi, "overpower"],
  [/\bkill\b/gi, "defeat"],
  [/\broll\b/gi, "tumble"],
];

function sanitizeBannedWords(input: string): string {
  let out = String(input ?? "");
  for (const [re, repl] of BANNED_WORDS) out = out.replace(re, repl);
  return out;
}

function finalizePrompt(input: string): string {
  return sanitizeBannedWords(input).trim();
}

// ─────────────────────────────────────────────────────────────
// RUNWAY-SPECIFIC SANITIZER
// [Official rule: Runway ignores JSON, doesn't support negatives,
//  and reiterating image elements reduces motion quality]
// ─────────────────────────────────────────────────────────────

/** Strips 30fps references from Runway prompts (official: 24/25 only) */
export function sanitizeRunwayFPS(prompt: string): string {
  return prompt.replace(/\b30\s*fps\b/gi, "").replace(/\b30fps\b/gi, "").trim();
}

/** Strips negative-prompt-like phrasing from Runway prompts */
export function sanitizeRunwayNegative(prompt: string): string {
  // Runway does NOT support negative prompts — remove "no X" patterns
  return prompt
    .replace(/\b(no|never|don't|do not|avoid|without)\s+[^,.;]+/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Full Runway prompt sanitizer (apply before final output) */
export function sanitizeRunwayPrompt(prompt: string): string {
  const out = sanitizeRunwayFPS(prompt);
  // Don't fully strip negatives from instructional text — only from paste-ready sections
  return out;
}

// ─────────────────────────────────────────────────────────────
// KLING 3.0 MOTION INTENSITY CALCULATOR
// [Official: 0.1–1.0, specify for predictable results]
// ─────────────────────────────────────────────────────────────

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
      return Math.max(0.1, base - 0.25); // Subtle tension
    case "action":
      return Math.min(1.0, base + 0.15); // Peak energy
    case "aftermath":
      return Math.max(0.1, base - 0.2); // Settling
    default:
      return base;
  }
}

// ─────────────────────────────────────────────────────────────
// SAFE ARC LABELS (platform-safe)
// ─────────────────────────────────────────────────────────────
const ARC_SAFE_LABEL: Record<string, string> = {
  "Chase and takedown": "chase sequence",
  "Ambush attack": "ambush sequence",
  "Escape from danger": "escape sequence",
  "Territory dominance battle": "dominance encounter",
  "Predator vs predator fight": "predator confrontation",
  "Pack hunting strategy": "pack coordination",
  "Defender stands ground": "defensive stand",
  "Giant vs giant clash": "giant confrontation",
};

function getSafeArcLabel(arc: string): string {
  return ARC_SAFE_LABEL[arc] || "wildlife encounter";
}

function getSafeArcPrint(arc: string): string {
  return getSafeArcLabel(arc);
}

// ─────────────────────────────────────────────────────────────
// Reference tags block
// ─────────────────────────────────────────────────────────────
function buildReferenceTagBlock(opts?: QualityOptions): string {
  const lockLine = opts?.referenceLock
    ? "Reference lock: ON (use the same tags every shot)."
    : "Reference lock: optional (tags still recommended).";

  return `REFERENCE TAGS (use these consistently)
- Predator master: ${REF_TAGS.heroPredator}
- Prey master: ${REF_TAGS.heroPrey}
- Environment plate: ${REF_TAGS.envPlate}
${lockLine}`.trim();
}
function buildKlingCharacterLine(
  predator: string,
  prey: string,
  motionOnlyI2V?: boolean
): string {
  return motionOnlyI2V
    ? `Characters: same ${predator} identity from input frame; same ${prey} identity from input frame.`
    : `Characters: ${predator} (predator — drives scene pressure); ${prey} (prey — fully alert and reactive).`;
}

function buildKlingLocationLine(
  env: string,
  weather: Weather,
  motionOnlyI2V?: boolean
): string {
  return motionOnlyI2V
    ? `Lighting & Location: same environment continuity, ${weatherVariants[weather]}.`
    : `Lighting & Location: ${env}, ${weatherVariants[weather]}.`;
}

function buildKlingExtraLine(
  base: string,
  motionOnlyI2V?: boolean
): string {
  return motionOnlyI2V ? base : `${base}.`;
}
// ─────────────────────────────────────────────────────────────
// Kling WIDE PHYSICS RULE
// [Kling 3.0: wide shots preserve biomechanics with 4K detail]
// ─────────────────────────────────────────────────────────────
function klingWidePhysicsRule(): string {
  return "WIDE PHYSICS RULE — Shot 2 and Shot 3 must be FIXED WIDE (full bodies visible) to preserve biomechanics, weight transfer, and collision readability. Kling 3.0's 4K output ensures micro-detail even in wide framing.";
}

// ─────────────────────────────────────────────────────────────
// ONE-ACTION HARD GATE
// ─────────────────────────────────────────────────────────────
function oneActionArcBeat(
  arc: Arc,
  beat: "establish" | "action" | "aftermath",
  enabled: boolean
): { predatorBeat: string; preyBeat: string; guardLine: string } {
  if (!enabled) {
    if (beat === "action") {
      return {
        predatorBeat: `commits to the ${getSafeArcLabel(arc)} beat with one clear movement`,
        preyBeat: "answers with one readable survival reaction",
        guardLine: "",
      };
    }
    if (beat === "aftermath") {
      return {
        predatorBeat: "slows and resets posture with one heavy breath release",
        preyBeat: "repositions once and holds distance, fully alert",
        guardLine: "",
      };
    }
    return {
      predatorBeat: "holds a coiled pre-action stance and exhales once",
      preyBeat: "locks attention and holds still once",
      guardLine: "",
    };
  }

  const baseGuard =
    "ONE-ACTION GATE — one primary predator action + one prey reaction only (no stacked beats).";

  switch (arc) {
    case "Chase and takedown":
      if (beat === "action") {
        return {
          predatorBeat: "accelerates into a single chase burst with grounded strides (no contact yet)",
          preyBeat: "breaks into one clean escape sprint with one evasive lane change",
          guardLine: `${baseGuard}\nChase gate: this shot is chase-only (no contact/capture actions).`,
        };
      }
      if (beat === "aftermath") {
        return {
          predatorBeat: "slows down and resets stance with one heavy breath release",
          preyBeat: "repositions once and holds distance, fully alert",
          guardLine: baseGuard,
        };
      }
      return {
        predatorBeat: "holds a coiled pre-chase stance and exhales once",
        preyBeat: "locks attention and freezes once",
        guardLine: baseGuard,
      };

    case "Ambush attack":
      if (beat === "action") {
        return {
          predatorBeat: "launches once from cover with one decisive forward commitment",
          preyBeat: "reacts once with a sharp evasive jump and turn",
          guardLine: baseGuard,
        };
      }
      return {
        predatorBeat:
          beat === "aftermath"
            ? "settles posture and exhales once, stance recovered"
            : "compresses low and still, breath controlled",
        preyBeat: beat === "aftermath" ? "stabilizes footing once, still alert" : "stiffens and locks attention once",
        guardLine: baseGuard,
      };

    case "Escape from danger":
      if (beat === "action") {
        return {
          predatorBeat: "commits once toward the target with a single forward pressure move",
          preyBeat: "executes one desperate escape move (one dodge or sprint burst)",
          guardLine: baseGuard,
        };
      }
      return {
        predatorBeat: beat === "aftermath" ? "halts and scans once, breath visible" : "builds pressure without advancing",
        preyBeat: beat === "aftermath" ? "regains footing once, still tense" : "tenses and prepares to flee",
        guardLine: baseGuard,
      };

    case "Territory dominance battle":
      if (beat === "action") {
        return {
          predatorBeat: "steps forward once in a controlled dominance advance",
          preyBeat: "answers once with a single threat display or retreat step",
          guardLine: baseGuard,
        };
      }
      return {
        predatorBeat: beat === "aftermath" ? "stands composed and exhales once" : "holds ground with still dominance",
        preyBeat: beat === "aftermath" ? "holds distance, posture tight" : "stays tense, watching",
        guardLine: baseGuard,
      };

    case "Predator vs predator fight":
      if (beat === "action") {
        return {
          predatorBeat: "commits one forward pressure beat (one shove / push / clash moment)",
          preyBeat: "responds once with one counter-step or recoil",
          guardLine: baseGuard,
        };
      }
      return {
        predatorBeat: beat === "aftermath" ? "resets stance and exhales once" : "circles pressure slowly without contact",
        preyBeat: beat === "aftermath" ? "rebalances once, eyes locked" : "mirrors stance, ready",
        guardLine: baseGuard,
      };

    case "Pack hunting strategy":
      if (beat === "action") {
        return {
          predatorBeat: "tightens formation once (one coordinated lateral close-in)",
          preyBeat: "reacts once by pivoting and attempting one escape direction",
          guardLine: baseGuard,
        };
      }
      return {
        predatorBeat: beat === "aftermath" ? "holds formation and exhales once" : "maintains disciplined spacing",
        preyBeat: beat === "aftermath" ? "holds distance, still tense" : "stays alert, scanning",
        guardLine: baseGuard,
      };

    case "Defender stands ground":
      if (beat === "action") {
        return {
          predatorBeat: "drives one decisive forward defense step (one push)",
          preyBeat: "reacts once with one recoil or sidestep",
          guardLine: baseGuard,
        };
      }
      return {
        predatorBeat: beat === "aftermath" ? "stands firm, breath settling" : "plants stance, head lowered",
        preyBeat: beat === "aftermath" ? "keeps distance, posture tight" : "tests space, cautious",
        guardLine: baseGuard,
      };

    case "Giant vs giant clash":
      if (beat === "action") {
        return {
          predatorBeat: "loads weight and commits one heavy clash beat (single impact moment)",
          preyBeat: "responds once with one grounded shove or recoil",
          guardLine: baseGuard,
        };
      }
      return {
        predatorBeat: beat === "aftermath" ? "settles weight and exhales once" : "approaches slowly with heavy weight transfer",
        preyBeat: beat === "aftermath" ? "rebalances once, still tense" : "holds ground, ready",
        guardLine: baseGuard,
      };

    default:
      return {
        predatorBeat: beat === "action" ? "commits to one clear movement beat" : "holds tension with controlled breath",
        preyBeat: beat === "action" ? "answers with one survival reaction" : "stays alert and reactive",
        guardLine: baseGuard,
      };
  }
}

function maybeGuard(line: string): string {
  return line ? `${line}\n` : "";
}

// ─────────────────────────────────────────────────────────────
// DEPTH
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// MICRO-MOTION
// ─────────────────────────────────────────────────────────────
export function buildMicroMotionLine(weather: Weather, env: string): string {
  const envLower = env.toLowerCase();
  if (weather === "Winter Blizzard" || weather === "Frozen Dusk")
    return "snow drift, subtle natural breath condensation, soft powder displacement, faint wind movement in distant brush";
  if (weather === "Storm")
    return "wind pressure through foliage, rain or mist disturbance, loose debris reacting to gusts";
  if (weather === "Golden Hour")
    return "warm dust motes, subtle grass sway, breath movement, drifting airborne particles in backlight";
  if (envLower.includes("water") || envLower.includes("river") || envLower.includes("lake") || envLower.includes("swamp"))
    return "water ripples, reeds moving gently, surface reflections shifting naturally";
  return "subtle foliage sway, drifting dust or mist, breath movement, light environmental reaction around the subjects";
}

// ─────────────────────────────────────────────────────────────
// KLING 3.0 NATIVE AUDIO PROMPT BUILDER (NEW)
// [Official: Kling 3.0 generates matching ambient sound from prompt]
// ─────────────────────────────────────────────────────────────
export function buildKlingAudioPrompt(
  predator: string,
  prey: string,
  env: string,
  weather: Weather,
  arc: Arc,
  beat: "establish" | "action" | "aftermath"
): string {
  const envLower = env.toLowerCase();

  // Base ambient by environment
  let ambient = "distant natural ambience, wind through terrain";
  if (envLower.includes("forest") || envLower.includes("jungle"))
    ambient = "distant bird calls, rustling canopy, layered forest ambience";
  else if (envLower.includes("savanna") || envLower.includes("grassland"))
    ambient = "dry wind sweeping grass, distant insect drone, open-plain ambience";
  else if (envLower.includes("arctic") || envLower.includes("snow") || envLower.includes("tundra"))
    ambient = "howling arctic wind, crunching ice surface, stark frozen silence";
  else if (envLower.includes("water") || envLower.includes("river") || envLower.includes("lake"))
    ambient = "flowing water, gentle ripples on surface, waterside wildlife";
  else if (envLower.includes("mountain") || envLower.includes("cliff"))
    ambient = "mountain wind, distant rockfall echoes, alpine silence";
  else if (envLower.includes("desert"))
    ambient = "desert wind whisper, sand grain movement, dry heat stillness";

  // Weather overlay
  let weatherAudio = "";
  if (weather === "Storm") weatherAudio = ", rolling thunder in distance, rain striking foliage";
  else if (weather === "Winter Blizzard") weatherAudio = ", fierce blizzard wind, snow pelting surfaces";
  else if (weather === "Frozen Dusk") weatherAudio = ", eerie frozen silence, crystalline wind";
  else if (weather === "Golden Hour") weatherAudio = ", warm twilight stillness, evening insect chorus";

  // Beat-specific animal audio
  let animalAudio = "";
  switch (beat) {
    case "establish":
      animalAudio = `${predator} slow controlled breathing through nostrils, ${prey} alert stillness with occasional tension exhale`;
      break;
    case "action":
      animalAudio = `heavy ground impact from ${predator} movement, explosive burst sounds, ${prey} distress vocalization, debris scatter`;
      break;
    case "aftermath":
      animalAudio = `${predator} heavy rhythmic breathing settling, terrain debris settling, ${prey} cautious repositioning footsteps`;
      break;
  }

  return finalizePrompt(
    `Audio: ${ambient}${weatherAudio}. ${animalAudio}. No music. Documentary field recording quality.`
  );
}

// ─────────────────────────────────────────────────────────────
// QUALITY SUMMARY
// ─────────────────────────────────────────────────────────────
export function buildQualitySummary(opts: QualityOptions): string {
  return finalizePrompt(
    [
      `Realism mode: ${opts.realismMode}.`,
      opts.referenceLock
        ? "Reference-locked workflow keeps the same animal face, markings, and body proportions across clips."
        : "Reference lock disabled — use only if you intentionally want variation.",
      opts.motionOnlyI2V
        ? "All video prompts are motion-led so the engines do not try to redraw the animal every shot."
        : "Video prompts may be more descriptive, which can increase drift.",
      opts.singleActionRule
        ? "Single-action prompting is active to reduce melting, tearing, and chaotic physics."
        : "Multi-action prompting can reduce coherence.",
      opts.microMotion
        ? "Environmental micro-motion is active to prevent static-scene syndrome."
        : "Background movement is minimal.",
      opts.heroVeo
        ? "Veo hero mode is active for the most realism-sensitive beats."
        : "Veo hero mode is off.",
    ].join(" ")
  );
}

// ─────────────────────────────────────────────────────────────
// REFERENCE WORKFLOW
// ─────────────────────────────────────────────────────────────
export function buildReferenceWorkflow(predator: string, opts: QualityOptions): string {
  const realismNote =
    opts.realismMode === "Reference Locked"
      ? "Use a clean, evenly lit master still with readable silhouette and separated background."
      : opts.realismMode === "High Naturalism"
        ? "Use a gritty still with real dirt, moisture, stray hairs, and believable contact shadows."
        : "Use a balanced hero still with strong separation and stable anatomy.";

  return finalizePrompt(`REFERENCE LOCK WORKFLOW — ${predator.toUpperCase()}
${realismNote}
STEP 1 — Generate one master image first.
STEP 2 — Use that exact image as the reference or first frame for every video clip.
  • Runway: Upload as I2V input. Prompt = motion only.
  • Kling 3.0: Upload as reference + enable "Bind Subject" (Elements 3.0).
STEP 3 — Keep video prompts focused on motion only: subject action, environment motion, camera motion.
STEP 4 — Change only one main motion beat per shot to preserve identity.
STEP 5 — If drift appears:
  • Runway: Extract previous last frame → use as new I2V input.
  • Kling: Re-upload master image with Bind Subject enabled.
STEP 6 — For Kling 3.0: Optionally set End Frame to guide resolution pose.`);
}

// ─────────────────────────────────────────────────────────────
// NATURALISM CHECKLIST
// ─────────────────────────────────────────────────────────────
export function buildNaturalismChecklist(opts: QualityOptions, weather: Weather, env: string): string[] {
  return [
    opts.realismMode === "High Naturalism" || opts.realismMode === "Reference Locked"
      ? "Inject biological imperfections: stray hairs, dirt, uneven fur breakup, paw pressure, moisture, asymmetry."
      : "Keep textures clean but not plastic.",
    `Keep one undeniable light geometry so motion engines can preserve form and shadow direction in ${weather.toLowerCase()} conditions.`,
    `Use environmental motion such as ${buildMicroMotionLine(weather, env)}.`,
    opts.motionOnlyI2V
      ? "Runway: Do NOT restate animal's appearance in I2V prompts (official rule — reduces motion quality). Kling: Keep appearance text to one clause max."
      : "If you describe appearance in video, keep it extremely short.",
    opts.singleActionRule
      ? "One subject action + one camera move per shot only."
      : "Avoid more than two simultaneous motion beats.",
    opts.referenceLock
      ? "Runway: Regenerate from master frame or previous last frame. Kling 3.0: Use Bind Subject / Elements for identity lock."
      : "Expect more visual variation without reference lock.",
  ].map(finalizePrompt);
}

// ─────────────────────────────────────────────────────────────
// FILM STOCK + MJ PARAMS
// ─────────────────────────────────────────────────────────────
const MJ_REALISM_PARAMS =
  "--ar 9:16 --style raw --s 100 --v 6.1 --q 4 --no plastic skin, cartoon, CGI, anime, watermark, text overlay, deformed anatomy, extra limbs";

function getFilmStock(cameraGear: string, lighting: string, weather: Weather): string {
  if (/(Kodak|Cinestill|Fujifilm|Ilford)/i.test(cameraGear)) return cameraGear;
  const lowLight =
    /(night|moonlight|dusk|dark|low light|single light source)/i.test(lighting) ||
    weather === "Frozen Dusk" ||
    weather === "Storm";
  return `${cameraGear}, ${lowLight ? "Cinestill 800T film emulation" : "Kodak Portra 400 film emulation"}`;
}

function finalizeImagePrompt(prompt: string, target: ImagePromptTarget): string {
  const base = finalizePrompt(prompt);
  if (target !== "MJ") return base;
  if (/--ar\s+9:16/i.test(base) || /--style\s+raw/i.test(base)) return base;
  return `${base} ${MJ_REALISM_PARAMS}`;
}

// ─────────────────────────────────────────────────────────────
// IMAGE PROMPT
// ─────────────────────────────────────────────────────────────
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
  target: ImagePromptTarget = "NB2"
): string {
  const depth = getDepthPrompt(depthMode);
  const tone = emotionalTonePrompt[emotionalTone];
  const vibe = animalVibePrompt[animalVibe];
  const cam = getFilmStock(cameraGear, lighting, weather);
const descInject = sceneDesc?.trim() ? `\n\nScene context: ${sceneDesc.trim()}` : "";
const qLead = buildQualityLead(quality, "image");

  const realismAdd =
    quality?.realismMode === "High Naturalism"
      ? "Biological imperfections visible — stray hairs, uneven fur breakup, mud, dust, moisture, asymmetrical detail, realistic paw pressure, true contact shadows."
      : quality?.realismMode === "Reference Locked"
        ? "Built as a master reference image for image-to-video continuity — stable silhouette, locked anatomy, readable markings, clean foreground/background separation."
        : "Balanced realism with stable anatomy, natural texture, and clean silhouette separation.";

  const A = `${predator} in a powerful pre-action stance, ${prey} fully alert and reactive — both animals at the most tension-rich beat of the ${getSafeArcLabel(arc)} scene. ${predator} exhales once, ribcage slightly expanded...`;
  const B = `${env}, ${weatherVariants[weather]}. Layered foreground, readable midground, softened background separation for stable depth maps. Subjects in authentic wildlife behavioral postures, biologically accurate spacing, natural environmental context.`;
  const C = `Wide cinematic wildlife documentary composition, 9:16 vertical frame. Camera: ${cam}, ${depth.lensNote}. ${vibe.camera}. Depth of field: ${depth.depth}. Telephoto compression and documentary framing. Lighting: ${lighting}. Natural rim separation, volumetric atmosphere, realistic shadow direction.`;
  const D = `${texture}. ${vibe.texture}. Micro-detail visible in fur, skin, feathers, debris, moisture, and ground contact. ${realismAdd}`;

  if (target === "NB2") {
  const B_ref = `${env}, ${weatherVariants[weather]}. Two-plane composition: foreground subjects fully separated from background, unambiguous silhouettes, stable depth map. Subjects placed for clear biomechanical readability — no overlap, each animal fully visible.`;
  const E_ref = `${vibe.style}, photorealistic, 8K RAW. Optimised for I2V reference consistency — distinct silhouettes, locked anatomy, stable depth planes.${descInject}`;

  return finalizeImagePrompt(`${qLead} ${A} ${B_ref} ${C} ${D} ${E_ref}`, target);
}

if (target === "NANO_BANANA_2") {
  const A_nb2 = `Subject: ${predator} and ${prey}, both fully visible, locked in the peak tension beat of a ${getSafeArcLabel(arc)} scene.`;
  const B_nb2 = `Context/background: ${env}, ${weatherVariants[weather]}. Natural habitat cues, readable terrain, clear background layers.`;
  const C_nb2 = `Pose/action: ${predator} in a powerful pre-action stance, ${prey} fully alert and reactive, authentic wildlife body language, biologically accurate spacing.`;
  const D_nb2 = `Composition: wide cinematic wildlife documentary frame, 9:16 vertical. Camera: ${cam}. ${vibe.camera}. ${depth.lensNote}. Depth of field: ${depth.depth}.`;
  const E_nb2 = `Lighting: ${lighting}. Natural rim separation, volumetric atmosphere, realistic shadow direction.`;
  const F_nb2 = `Style: ${vibe.style}, photorealistic. ${texture}. ${vibe.texture}. Micro-detail visible in fur, skin, feathers, debris, moisture, and ground contact. ${realismAdd}${descInject}`;

  return finalizeImagePrompt(
    `${qLead} ${A_nb2} ${B_nb2} ${C_nb2} ${D_nb2} ${E_nb2} ${F_nb2}`,
    target
  );
}

if (target === "RUNWAY") {
  const E_runway = `${vibe.style}, photorealistic, cinematic grade. Built as a stable master reference for Runway Gen-4.5 I2V continuity — clean separation, readable silhouette, stable anatomy. High-quality input free of visual artifacts for best I2V results.${descInject}`;

  return finalizeImagePrompt(`${qLead} ${A} ${B} ${C} ${D} ${E_runway}`, target);
}

const E = `${vibe.style}, photorealistic, cinematic grade.${descInject}`;
return finalizeImagePrompt(`${qLead} ${A} ${B} ${C} ${D} ${E}`, target);
}

// ─────────────────────────────────────────────────────────────
// NEGATIVE PROMPT (Kling 3.0 / MJ only — NEVER for Runway)
// [Official: Runway Gen-4/4.5 does NOT support negative prompts.
//  Kling 3.0: Negative prompts supported and recommended.]
// ─────────────────────────────────────────────────────────────
export function buildNegativePrompt(predator: string): string {
  // Updated for Kling 3.0 official negative prompt best practices
  const base =
    "cartoon, CGI look, anime style, unnatural motion, morphing artifacts, " +
    "split screen, floating limbs, jerky movement, watermark, text overlay, " +
    "extra limbs, colour banding, fire, flame, fantasy breath, " +
    "exaggerated vapor glow, energy effect, light beam, glowing mouth, " +
    "smiling, laughing, cartoonish expression, bright unnatural colors, " +
    // Kling 3.0 specific anti-drift additions:
    "face distortion, warping, morphing textures, inconsistent physics, " +
    "background shifting, changing markings, extra digits, deformed anatomy";

  const specific: Record<string, string> = {
    Lion: "wrong mane colour, extra mane, mane drift between shots",
    Tiger: "wrong stripe pattern, blurry markings, stripe morphing",
    "Siberian Tiger": "wrong stripe density, tropical setting, stripe warping",
    Leopard: "wrong rosette pattern, rosette morphing",
    Jaguar: "wrong spot pattern, spot shifting",
    "Snow Leopard": "wrong spot pattern, short tail, tail length changing",
    Cheetah: "wrong tear marks, thick mane, tear mark drift",
    Shark: "cartoon fins, fin morphing",
    Orca: "wrong colour pattern, pattern shifting between frames",
    "Komodo Dragon": "wrong scale pattern, scale morphing",
    "Polar Bear": "wrong fur colour, tropical environment, fur colour drift",
    Bobcat: "wrong spot pattern, long tail, marking inconsistency",
    Alligator: "wrong scale pattern, fictional setting, jaw deformation",
  };

  return finalizePrompt(`${base}${specific[predator] ? `, ${specific[predator]}` : ""}`);
}

// ─────────────────────────────────────────────────────────────
// THUMBNAIL PROMPT
// ─────────────────────────────────────────────────────────────
export function buildThumbnailPrompt(
  predator: string,
  prey: string,
  env: string,
  lighting: string,
  weather: Weather,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe
): string {
  const tone = emotionalTonePrompt[emotionalTone];
  const vibe = animalVibePrompt[animalVibe];
  return finalizePrompt(
    `Ultra dramatic wildlife documentary thumbnail close-up of ${predator} and ${prey} in ${env}, ${weatherVariants[weather]}. ${tone.image}. Intense mutual awareness, raw animal instinct, ${lighting}. ${vibe.style}. Photorealistic documentary realism, 9:16 vertical frame.`
  );
}

// ─────────────────────────────────────────────────────────────
// VOICEOVER LINE
// ─────────────────────────────────────────────────────────────
export function buildVoiceoverLine(
  predator: string,
  prey: string,
  env: string,
  emotionalTone: EmotionalTone
): string {
  const tone = emotionalTonePrompt[emotionalTone];
  return finalizePrompt(
    `In the wild heart of ${env}, a ${predator.toLowerCase()} and a ${prey.toLowerCase()} share the same moment. ${tone.voiceover}`
  );
}

// ─────────────────────────────────────────────────────────────
// RUNWAY SHOTS — GEN-4.5 OFFICIAL FORMAT
//
// [Official structure: [Camera] [subject] [action] in [environment]]
// [I2V: motion-only. Do NOT restate appearance from image.]
// [Sequential: "X occurs, then Y occurs. Finally, Z occurs."]
// [Timestamps optional: [00:01] X. [00:04] Y.]
// [24/25fps only. Duration 2-10s.]
// ─────────────────────────────────────────────────────────────
export function buildRunwayShots(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  model: RunwayModel,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions
): { shot1: string; shot2: string; shot3: string } {
  const note = RUNWAY_STYLE_NOTE[model];
  const tone = emotionalTonePrompt[emotionalTone];
  const vibe = animalVibePrompt[animalVibe];
  const micro = buildMicroMotionLine(weather, env);

  const qLead = buildQualityLead(quality, "runway");
  const refTags = buildReferenceTagBlock(quality);
  const context = sceneDesc?.trim() ? `\nScene continuity: ${sceneDesc.trim().slice(0, 150)}` : "";

  const refLine = quality?.referenceLock
    ? "Use the uploaded master image or previous last frame as the locked reference."
    : "Use the current shot as the visual guide.";

  // Official Runway I2V rule enforcement
  const motionRule = quality?.motionOnlyI2V
    ? "⚠️ RUNWAY I2V RULE (Official): Image carries ALL identity (coat, markings, anatomy). This prompt describes MOTION, CAMERA, and PHYSICS only. Do NOT restate subject appearance — doing so reduces motion quality."
    : "Keep appearance text minimal; motion is the priority.";

  const singleRule = quality?.singleActionRule
    ? "One primary subject action and one camera move only."
    : "Keep motion readable and limited.";

  const seamless = quality?.seamlessShot
    ? "Continuous, seamless shot."
    : "";

  const gateOn = !!quality?.singleActionRule;
  const beat1 = oneActionArcBeat(arc, "establish", gateOn);
  const beat2 = oneActionArcBeat(arc, "action", gateOn);
  const beat3 = oneActionArcBeat(arc, "aftermath", gateOn);

  // Shot 1 — Official Runway structure: [Camera] as [subject] [action]
  const shot1PasteReady = sanitizeRunwayFPS(
    `Slow dolly-in. ${predator} exhales once — ribcage settles. ${prey} holds still, body rigid. ${micro}. ${seamless}`.trim()
  );

  // Shot 2 — Action
  const shot2PasteReady = sanitizeRunwayFPS(
    `Tracking move. ${predator} ${beat2.predatorBeat}. ${prey} ${beat2.preyBeat}. Ground scatter, body-weight transfer. ${micro}. ${seamless}`.trim()
  );

  // Shot 3 — Aftermath
  const shot3PasteReady = sanitizeRunwayFPS(
    `Slow pull-back. ${predator} exhales — posture resets, eye-line engaged. Residual atmosphere, ${micro}. ${seamless}`.trim()
  );

  return {
    shot1: finalizePrompt(`RUNWAY SHOT 1 — ESTABLISHING [${model}]
${note}
${qLead}
${refTags}
${refLine}
${motionRule}
${singleRule}
${maybeGuard(beat1.guardLine)}${context}

═══ PASTE-READY I2V PROMPT (copy this into Runway) ═══
${shot1PasteReady}

─── SHOT BREAKDOWN ───
Camera motion: slow dolly-in.
Subject action: ${predator} ${beat1.predatorBeat}.
Prey reaction: ${prey} ${beat1.preyBeat}.
Environment motion: ${micro}.
Tone: ${tone.video}.
Framing: ${vibe.camera}.
Duration: 5–10 seconds recommended.
FPS: 24 or 25 (set in Advanced).
⚠️ No negative prompt — Runway does not support negatives.
After generation: extract LAST FRAME for Shot 2 chaining.`),

    shot2: finalizePrompt(`RUNWAY SHOT 2 — ACTION${gateOn ? " (ONE-ACTION)" : ""} [${model}]
${note}
${qLead}
${refTags}
${refLine}
${motionRule}
${singleRule}
${maybeGuard(beat2.guardLine)}${context}

═══ PASTE-READY I2V PROMPT (copy this into Runway) ═══
${shot2PasteReady}

─── SHOT BREAKDOWN ───
Camera motion: controlled tracking move.
Subject action: ${predator} ${beat2.predatorBeat}.
Prey reaction: ${prey} ${beat2.preyBeat}.
Environment motion: ground scatter, foliage response, body-weight transfer, ${micro}.
Physics: preserve natural acceleration and deceleration.
Duration: 5–10 seconds recommended.
⚠️ Upload Shot 1 last frame as I2V input.`),

    shot3: finalizePrompt(`RUNWAY SHOT 3 — AFTERMATH [${model}]
${note}
${qLead}
${refTags}
${refLine}
${motionRule}
${singleRule}
${maybeGuard(beat3.guardLine)}

═══ PASTE-READY I2V PROMPT (copy this into Runway) ═══
${shot3PasteReady}

─── SHOT BREAKDOWN ───
Camera motion: slow pull-back.
Subject action: ${predator} ${beat3.predatorBeat}.
Prey reaction: ${prey} ${beat3.preyBeat}.
Environment motion: residual atmosphere — ${micro}.
Mood: ${tone.image}.
Duration: 5–10 seconds recommended.
⚠️ Upload Shot 2 last frame as I2V input.`),
  };
}

// ─────────────────────────────────────────────────────────────
// KLING SHOTS — 3.0 OFFICIAL FORMAT
//
// [SCALE framework: Shot → Character → Action → Lighting → Extra]
// [Native 4K at 60fps. Duration 3–15s. Up to 6 multi-shot.]
// [Negative prompts supported. Motion intensity recommended.]
// [Native audio integrated. Bind Subject for identity lock.]
// ─────────────────────────────────────────────────────────────
export function buildKlingShots(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  model: KlingModel,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions
): { shot1: string; shot2: string; shot3: string } {
  const note = KLING_STYLE_NOTE[model];
  const tone = emotionalTonePrompt[emotionalTone];
  const vibe = animalVibePrompt[animalVibe];
  const micro = buildMicroMotionLine(weather, env);

  const qLead = buildQualityLead(quality, "kling");
  const context = sceneDesc?.trim() ? `\nScene continuity: ${sceneDesc.trim().slice(0, 150)}` : "";

  const refLine = quality?.referenceLock
    ? "Reference lock active — enable 'Bind Subject' (Elements 3.0) to preserve exact subject identity from the input frame."
    : "Preserve overall continuity from the source frame.";

  const motionRule = quality?.motionOnlyI2V
    ? "Motion-only prompting active — do not redescribe the subject's look. Kling 3.0 I2V treats image as 3D anchor."
    : "Keep visual restatement minimal.";

  const singleRule = quality?.singleActionRule
    ? "One action beat only — no stacked actions."
    : "Keep action focused.";

  const wideRule = klingWidePhysicsRule();

  const gateOn = !!quality?.singleActionRule;
  const beat1 = oneActionArcBeat(arc, "establish", gateOn);
  const beat2 = oneActionArcBeat(arc, "action", gateOn);
  const beat3 = oneActionArcBeat(arc, "aftermath", gateOn);

  // Motion intensity per beat
  const mi1 = getKlingMotionIntensity(arc, "establish");
  const mi2 = getKlingMotionIntensity(arc, "action");
  const mi3 = getKlingMotionIntensity(arc, "aftermath");

  // Audio prompts
  const audio1 = buildKlingAudioPrompt(predator, prey, env, weather, arc, "establish");
  const audio2 = buildKlingAudioPrompt(predator, prey, env, weather, arc, "action");
  const audio3 = buildKlingAudioPrompt(predator, prey, env, weather, arc, "aftermath");
    const characterLine = buildKlingCharacterLine(predator, prey, quality?.motionOnlyI2V);
  const locationLine = buildKlingLocationLine(env, weather, quality?.motionOnlyI2V);
  const extra1 = quality?.motionOnlyI2V
    ? `${micro}. Photorealistic wildlife documentary. 9:16 vertical.`
    : `${micro}. ${tone.video}. ${vibe.style}. Photorealistic wildlife documentary. 9:16 vertical.`;
  const extra3 = quality?.motionOnlyI2V
    ? `${micro}. ${tone.image}.`
    : `${micro}. ${vibe.style}. ${tone.image}.`;

  return {
    shot1: finalizePrompt(`KLING SHOT 1 — TENSION [${model}]
${note}
${qLead}
${refLine}
${motionRule}
${singleRule}
Motion intensity: ${mi1.toFixed(2)}
${maybeGuard(beat1.guardLine)}${context}

═══ KLING 3.0 PROMPT (SCALE format) ═══
Shot: Subtle handheld drift or static hold, medium-wide framing.
${characterLine}
Action: ${predator} ${beat1.predatorBeat}. ${prey} ${beat1.preyBeat}.
${locationLine}
Extra: ${buildKlingExtraLine(extra1, quality?.motionOnlyI2V)}

${audio1}

Kling settings: Motion intensity ${mi1.toFixed(2)} | Enable Bind Subject for identity lock | Negative prompt: use the Kling Negative Prompt card`),

    shot2: finalizePrompt(`KLING SHOT 2 — STRIKE (WIDE${gateOn ? " + ONE-ACTION" : ""}) [${model}]
${note}
${qLead}
${refLine}
${motionRule}
${singleRule}
${wideRule}
Motion intensity: ${mi2.toFixed(2)}
${maybeGuard(beat2.guardLine)}${context}

═══ KLING 3.0 PROMPT (SCALE format) ═══
Shot: FIXED WIDE — full bodies visible, no crop, no close-ups.
${characterLine}
Action: ${predator} ${beat2.predatorBeat}. ${prey} ${beat2.preyBeat}.
${locationLine}
Extra: ${buildKlingExtraLine(`Debris response, surface displacement, ${micro}. Physics priority: coherent limbs, grounded weight, readable impact`, quality?.motionOnlyI2V)}

${audio2}

Kling settings: Motion intensity ${mi2.toFixed(2)} | WIDE framing enforced | Upload Shot 1 last frame as I2V reference`),

    shot3: finalizePrompt(`KLING SHOT 3 — AFTERMATH (WIDE${gateOn ? " + ONE-ACTION" : ""}) [${model}]
${note}
${qLead}
${refLine}
${motionRule}
${singleRule}
${wideRule}
Motion intensity: ${mi3.toFixed(2)}
${maybeGuard(beat3.guardLine)}${context}

═══ KLING 3.0 PROMPT (SCALE format) ═══
Shot: LOCKED FIXED WIDE — no movement, full bodies visible.
${characterLine}
Action: ${predator} ${beat3.predatorBeat}. ${prey} ${beat3.preyBeat}.
${locationLine}
Extra: ${buildKlingExtraLine(extra3, quality?.motionOnlyI2V)}

${audio3}

Kling settings: Motion intensity ${mi3.toFixed(2)} | Optionally set End Frame for final pose | Upload Shot 2 last frame as I2V reference`),
  };
}

// ─────────────────────────────────────────────────────────────
// KLING NATIVE 15-SECOND MULTI-SHOT
// [Official Kling 3.0: 15s native, up to 6 shots per prompt]
// ─────────────────────────────────────────────────────────────
export function buildKlingNative15s(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  model: KlingModel,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions
): string {
  const note = KLING_STYLE_NOTE[model];
  const tone = emotionalTonePrompt[emotionalTone];
  const vibe = animalVibePrompt[animalVibe];
  const micro = buildMicroMotionLine(weather, env);

  const qLead = buildQualityLead(quality, "kling");
  const context = sceneDesc?.trim() ? `\nScene context: ${sceneDesc.trim().slice(0, 150)}` : "";

  const isNative = model === "Kling 3.0 Pro" || model === "Kling 3.0 Standard";

  const refLine = quality?.referenceLock
    ? "Reference lock active — enable Bind Subject (Elements 3.0) to preserve exact subject identity across all 3 beats."
    : "Maintain consistent subject appearance, scale, and environment across all 3 beats.";

  const motionRule = quality?.motionOnlyI2V
    ? "Motion-only mode — do not redescribe subject appearance. Image = 3D anchor."
    : "Keep visual restatement minimal across all beats.";

  const wideRule = klingWidePhysicsRule();
  const cfgScales = getKlingCfgScales(arc);
  const cfgLine = `Guidance Scale: Shot 1 → ${cfgScales.shot1} | Shot 2 → ${cfgScales.shot2} | Shot 3 → ${cfgScales.shot3} (set in Kling settings, 0.0–1.0)`;

  const gateOn = !!quality?.singleActionRule;
  const b1 = oneActionArcBeat(arc, "establish", gateOn);
  const b2 = oneActionArcBeat(arc, "action", gateOn);
  const b3 = oneActionArcBeat(arc, "aftermath", gateOn);

  // Motion intensities
  const mi1 = getKlingMotionIntensity(arc, "establish");
  const mi2 = getKlingMotionIntensity(arc, "action");
  const mi3 = getKlingMotionIntensity(arc, "aftermath");

  // Audio prompts for each beat
  const audio1 = buildKlingAudioPrompt(predator, prey, env, weather, arc, "establish");
  const audio2 = buildKlingAudioPrompt(predator, prey, env, weather, arc, "action");
  const audio3 = buildKlingAudioPrompt(predator, prey, env, weather, arc, "aftermath");
    const nativeSceneLine = quality?.motionOnlyI2V
    ? `Scene: same environment continuity, ${weatherVariants[weather]}.`
    : `Scene: ${env}, ${weatherVariants[weather]}.`;
  const nativeCharacterLine = quality?.motionOnlyI2V
    ? `Characters: same ${predator} identity from input frame. Same ${prey} identity from input frame.`
    : `Characters: ${predator} (predator — drives scene pressure). ${prey} (prey — fully reactive throughout).`;

  const body = `═══ KLING 3.0 MULTI-SHOT PROMPT (SCALE format) ═══

${nativeSceneLine}
${nativeCharacterLine}
Style: ${vibe.style}. ${tone.image}. Photorealistic wildlife documentary. 9:16 vertical frame.
Arc: ${getSafeArcPrint(arc)}.
${wideRule}

Shot 1 — INITIATION (0–5 seconds) | Motion: ${mi1.toFixed(2)}:
${maybeGuard(b1.guardLine)}${predator} ${b1.predatorBeat}. ${prey} ${b1.preyBeat}.
Camera: static hold or subtle handheld drift.
Environment motion: ${micro}.
${audio1}

Shot 2 — ESCALATION (5–10 seconds) — WIDE | Motion: ${mi2.toFixed(2)}:
${maybeGuard(b2.guardLine)}${predator} ${b2.predatorBeat}. ${prey} ${b2.preyBeat}.
Camera: FIXED WIDE — full bodies visible; no crop; no close-ups.
Environment motion: surface displacement, debris scatter, ${micro}.
Physics priority: grounded weight transfer, coherent limb mechanics, readable impact.
${audio2}

Shot 3 — RESOLUTION (10–15 seconds) — WIDE | Motion: ${mi3.toFixed(2)}:
${maybeGuard(b3.guardLine)}${predator} ${b3.predatorBeat}. ${prey} ${b3.preyBeat}.
Camera: LOCKED FIXED WIDE — full bodies visible; no crop; no close-ups.
Environment motion: residual atmosphere — ${micro}.
${audio3}`;

  if (!isNative) {
    return finalizePrompt(`⚠️ KLING NATIVE 15S: Requires Kling 3.0 Pro or Kling 3.0 Standard.
Selected: ${model}. Switch model to activate.

─────────────────────────────────────
${note}
${qLead}
${refLine}
${motionRule}${context}

${body}`);
  }

  return finalizePrompt(`KLING NATIVE 15-SECOND MULTI-SHOT [${model}]
─────────────────────────────────────────────────────────
${note}
${qLead}
${refLine}
${motionRule}
${cfgLine}
Motion intensities: Shot 1 → ${mi1.toFixed(2)} | Shot 2 → ${mi2.toFixed(2)} | Shot 3 → ${mi3.toFixed(2)}${context}

${body}

─────────────────────────────────────────────────────────
HOW TO USE (Kling 3.0 Official Workflow):
1. Generate master image first (Image Prompt → NB2/Flux).
2. Upload master image as reference in Kling 3.0 Pro/Standard.
3. Enable "Bind Subject" (Elements 3.0) for identity lock.
4. Paste THIS ENTIRE PROMPT as one single text prompt.
5. Set Guidance Scale: ${cfgScales.shot2} (0.0–1.0 range).
6. Enable native audio for documentary-quality sound.
7. Output: Native 4K at 60fps available.
8. Optional: Set End Frame image for final-pose control.
✅ Native single-prompt workflow — identity preserved across all 3 beats.`);
}

// ─────────────────────────────────────────────────────────────
// KLING 6-SHOT MULTI-SCENE
// [Official Kling 3.0: Up to 6 shots in one prompt]
// ─────────────────────────────────────────────────────────────
export function buildKlingSixShot(
  predator: string,
  prey: string,
  env: string,
  arc: Arc,
  weather: Weather,
  model: KlingModel,
  emotionalTone: EmotionalTone,
  animalVibe: AnimalVibe,
  sceneDesc?: string,
  quality?: QualityOptions
): string {
  const note = KLING_STYLE_NOTE[model];
  const tone = emotionalTonePrompt[emotionalTone];
  const vibe = animalVibePrompt[animalVibe];
  const micro = buildMicroMotionLine(weather, env);

  const qLead = buildQualityLead(quality, "kling");
  const context = sceneDesc?.trim() ? `\nScene context: ${sceneDesc.trim().slice(0, 150)}` : "";

  const isNative = model === "Kling 3.0 Pro" || model === "Kling 3.0 Standard";
  const cfgBase = arcCfgScale[arc] ?? 0.55;

  if (!isNative) {
    return finalizePrompt(
      `⚠️ KLING 6-SHOT: Requires Kling 3.0 Pro or Kling 3.0 Standard.\nSelected: ${model}. Switch model to activate.`
    );
  }

  const wideRule =
    "WIDE PHYSICS RULE — Action + aftermath shots must be WIDE (full bodies visible) for realistic biomechanics.";

  const gateOn = !!quality?.singleActionRule;
  const b5 = oneActionArcBeat(arc, "action", gateOn);
  const b6 = oneActionArcBeat(arc, "aftermath", gateOn);
    const sixShotSceneLine = quality?.motionOnlyI2V
    ? `Scene: same environment continuity, ${weatherVariants[weather]}.`
    : `Scene: ${env}, ${weatherVariants[weather]}.`;
  const sixShotCharacterLine = quality?.motionOnlyI2V
    ? `Characters: same ${predator} identity from input frame. Same ${prey} identity from input frame.`
    : `Characters: ${predator} (drives pressure). ${prey} (fully reactive).`;

  return finalizePrompt(`KLING 6-SHOT MULTI-SCENE [${model}] — Native Single-Prompt Format
──────────────────────────────────────────────────────
${note}
${qLead}
Guidance Scale: ${cfgBase} (0.0–1.0 range)
${wideRule}${context}

═══ KLING 3.0 MULTI-SHOT PROMPT (6 shots) ═══

${sixShotSceneLine}
${sixShotCharacterLine}
Style: ${vibe.style}. ${tone.image}. Photorealistic wildlife documentary. 9:16 vertical frame.
Story arc: ${getSafeArcPrint(arc)}.

Shot 1 — MACRO CLOSE-UP (0–2s) | Motion: 0.20:
${predator} eye fills frame — iris visible, catch light sharp, pupil dilated.
Camera: locked static macro.
Audio: controlled predator breathing, sharp inhale.

Shot 2 — WIDE ESTABLISHING (2–5s) | Motion: 0.30:
${predator} LEFT, ${prey} RIGHT, ~10m apart. ${predator} exhales once. ${prey} freezes.
Camera: locked wide.
Audio: wind through terrain, tension stillness.

Shot 3 — PROFILE TRACKING (5–8s) | Motion: 0.45:
${predator} shifts weight forward — shoulders compress. ${prey} rises to threat display.
Camera: low side-angle tracking, very slow.
Audio: weight transfer on ground surface, ${prey} alert vocalization.

Shot 4 — SHOT-REVERSE-SHOT (8–11s) | Motion: 0.35:
Alternating close-ups: ${predator} intensity / ${prey} panic tells.
Camera: no movement.
Audio: rapid alternating breathing patterns.

Shot 5 — ACTION WIDE (11–14s) — WIDE | Motion: ${getKlingMotionIntensity(arc, "action").toFixed(2)}:
${maybeGuard(b5.guardLine)}${predator} ${b5.predatorBeat}. ${prey} ${b5.preyBeat}.
Camera: FIXED WIDE — full bodies visible; no crop; no close-ups.
Environment: debris + ${micro}.
Audio: ${buildKlingAudioPrompt(predator, prey, env, weather, arc, "action")}

Shot 6 — AFTERMATH WIDE (14–17s) — WIDE | Motion: ${getKlingMotionIntensity(arc, "aftermath").toFixed(2)}:
${maybeGuard(b6.guardLine)}${predator} ${b6.predatorBeat}. ${prey} ${b6.preyBeat}.
Camera: LOCKED FIXED WIDE — full bodies visible; no crop; no close-ups.
Audio: ${buildKlingAudioPrompt(predator, prey, env, weather, arc, "aftermath")}

──────────────────────────────────────────────────────
HOW TO USE (Kling 3.0 Official 6-Shot Workflow):
1. Generate master image (Image Prompt).
2. Upload master image as reference.
3. Enable "Bind Subject" (Elements 3.0) for identity lock.
4. Use Multi-Prompt mode: create 6 Shot Prompts with durations.
   OR paste THIS ENTIRE PROMPT as one single input.
5. Enable native audio for documentary-quality sound.
6. Output: Native 4K at 60fps.
✅ One prompt → 6 cinematic shots with consistent identity and audio.`);
}

// ─────────────────────────────────────────────────────────────
// 10 IDEAS
// ─────────────────────────────────────────────────────────────
export function build10Ideas(predator: string, preyList: string[], preset: PredatorInfo): string[] {
  const ideas: string[] = [];
  const seen = new Set<string>();
  const add = (idea: string) => {
    const safe = finalizePrompt(idea);
    if (!seen.has(safe) && ideas.length < 10) {
      seen.add(safe);
      ideas.push(safe);
    }
  };

  preyList.forEach((prey) =>
    add(`${predator} vs ${prey} — ${getSafeArcPrint(preset.defaultArc)} in ${preset.environment}`)
  );

  for (const a of arcs) {
    for (const p of preyList) add(`${predator} vs ${p} — ${getSafeArcPrint(a)} in ${preset.environment}`);
  }

  for (const w of weatherOptions) {
    for (const p of preyList)
      add(`${predator} vs ${p} — ${getSafeArcPrint(preset.defaultArc)} during ${w} in ${preset.environment}`);
  }

  [
    `${predator} vs rival ${predator} — dominance encounter in ${preset.environment}`,
    `Young ${predator} first hunt — ${getSafeArcPrint(preset.defaultArc)} in ${preset.environment}`,
    `${predator} at night — full moon ambush in ${preset.environment}`,
    `${predator} mother protecting cubs in ${preset.environment}`,
    `Rare: ${predator} vs ${preyList[preyList.length - 1]} — desperate escape in ${preset.environment}`,
  ].forEach(add);

  return ideas.slice(0, 10);
}

// ─────────────────────────────────────────────────────────────
// CAPCUT PLAN
// ─────────────────────────────────────────────────────────────
export function buildCapCutPlan(predator: string, arc: string, weather: Weather): string {
  const safeArc = getSafeArcPrint(arc);
  return finalizePrompt(`CAPCUT PLAN — ${predator} | Arc: ${safeArc} | Weather: ${weather}`);
}

// ─────────────────────────────────────────────────────────────
// CLIP CHAINING
// [Updated with official chaining methods for both engines]
// ─────────────────────────────────────────────────────────────
export function buildClipChaining(predator: string, driftRisk: PredatorInfo["driftRisk"]): string {
  const riskLine =
    driftRisk === "HIGH"
      ? "DRIFT HIGH — reference image on EVERY clip. Weight: 0.6–0.8."
      : driftRisk === "MEDIUM"
        ? "DRIFT MEDIUM — upload reference before each clip."
        : "DRIFT LOW — generate freely.";

  return finalizePrompt(`CLIP CHAINING — ${predator.toUpperCase()}
${riskLine}

═══ RUNWAY GEN-4.5 CHAINING (Official Method) ═══
STEP 1 — Generate Shot 1 (Runway I2V) → extract LAST FRAME.
  • Move playback scrubber to the very end of the completed video.
  • This loads the selected frame into the current model.
STEP 2 — Chain Shot 2: upload last frame as I2V input. Prompt = motion only.
STEP 3 — Chain Shot 3: upload Shot 2 last frame. Lowest motion complexity.
STEP 4 — Combine clips in a video editor. Remove the shared frame.

═══ KLING 3.0 CHAINING ═══
STEP 1 — Generate Shot 1 (Kling I2V) → extract last frame.
STEP 2 — Upload last frame as I2V input + enable Bind Subject.
STEP 3 — Optionally set End Frame for precise pose control.
STEP 4 — Alternative: use Multi-Shot mode (up to 6 shots, single prompt).

RULE: Subject description WORD-FOR-WORD identical across all clips.
RULE (Runway): Do NOT include appearance text in I2V prompts.
RULE (Kling): Use Bind Subject (Elements 3.0) for identity lock.`);
}

// ─────────────────────────────────────────────────────────────
// ENGINE CONSTRAINT VALIDATOR (NEW — catches misconfigs before paste)
// ─────────────────────────────────────────────────────────────
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
        message: "Runway Gen-4/4.5 does NOT support negative prompts. Remove the negative prompt.",
      });
    }
    if (opts.hasAppearanceInPrompt) {
      warnings.push({
        engine: "runway",
        level: "warning",
        message: "Runway I2V: Restating appearance from the image can reduce motion quality. Use motion-only prompts.",
      });
    }
  }

  if (opts.engine === "kling") {
    if (opts.duration && (opts.duration < 3 || opts.duration > 15)) {
      warnings.push({
        engine: "kling",
        level: "error",
        message: `Kling 3.0 duration must be 3–15 seconds. You set ${opts.duration}s.`,
      });
    }
    if (!opts.hasNegativePrompt) {
      warnings.push({
        engine: "kling",
        level: "info",
        message: "Kling 3.0 supports negative prompts — recommended for reducing drift and artifacts.",
      });
    }
  }

  return warnings;
}
