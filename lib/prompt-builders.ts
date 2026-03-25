// ─────────────────────────────────────────────────────────────
// lib/prompt-builders.ts
// WSTV — Pure Prompt Builder Functions
//
// RULES:
//   • Pure functions only — no React, no useState, no UI imports
//   • Takes plain data → returns string or object
//   • All data comes from predator-data.ts and model-specs.ts
//
// FPS NOTE [Runway official]:
//   Gen-4.5 supports 24fps / 25fps. Prompt मा 30fps नलेख्ने।
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

// Imported from quality-lead.ts to break circular dependency
// Re-exported so existing consumers don't break
import { buildQualityLead } from "@/lib/quality-lead";
import { buildMotionBrushPlan } from "./workflow-packs";
export { buildQualityLead };

// ─────────────────────────────────────────────────────────────
// Banned-words sanitizer (test-safe + platform-safe)
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
// SAFE ARC LABELS (test-safe)
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
// Reference tags block (standardized labels)
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

// ─────────────────────────────────────────────────────────────
// Kling wide physics rule
// ─────────────────────────────────────────────────────────────
function klingWidePhysicsRule(): string {
  return "WIDE PHYSICS RULE — Shot 2 and Shot 3 must be FIXED WIDE (full bodies visible) to preserve biomechanics, weight transfer, and collision readability.";
}

// ─────────────────────────────────────────────────────────────
// One-action hard gate
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
STEP 3 — Keep video prompts focused on motion only: subject action, environment motion, camera motion.
STEP 4 — Change only one main motion beat per shot to preserve identity.
STEP 5 — If drift appears, regenerate from the previous last frame instead of rewriting the subject.`);
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
      ? "Do not restate the animal's appearance inside video prompts; let the image carry identity."
      : "If you describe appearance in video, keep it extremely short.",
    opts.singleActionRule
      ? "One subject action + one camera move per shot only."
      : "Avoid more than two simultaneous motion beats.",
    opts.referenceLock
      ? "Regenerate from the master frame or previous last frame whenever markings start to drift."
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

  const realismAdd =
    quality?.realismMode === "High Naturalism"
      ? "Biological imperfections visible — stray hairs, uneven fur breakup, mud, dust, moisture, asymmetrical detail, realistic paw pressure, true contact shadows."
      : quality?.realismMode === "Reference Locked"
        ? "Built as a master reference image for image-to-video continuity — stable silhouette, locked anatomy, readable markings, clean foreground/background separation."
        : "Balanced realism with stable anatomy, natural texture, and clean silhouette separation.";

  const A = `${predator} in a powerful pre-action stance, ${prey} fully alert and reactive — both animals at the most tension-rich beat of the ${getSafeArcLabel(
    arc
  )} scene. ${predator} exhales once, ribcage slightly expanded...`;
  const B = `${env}, ${weatherVariants[weather]}. Layered foreground, readable midground, softened background separation for stable depth maps. Subjects in authentic wildlife behavioral postures, biologically accurate spacing, natural environmental context.`;
  const C = `Wide cinematic wildlife documentary composition, 9:16 vertical frame. Camera: ${cam}, ${depth.lensNote}. ${vibe.camera}. Depth of field: ${depth.depth}. Telephoto compression and documentary framing. Lighting: ${lighting}. Natural rim separation, volumetric atmosphere, realistic shadow direction.`;
  const D = `${texture}. ${vibe.texture}. Micro-detail visible in fur, skin, feathers, debris, moisture, and ground contact. ${realismAdd}`;

  const E =
    target === "NB2"
      ? `${vibe.style}, photorealistic, 8K RAW, cinematic colour grade. Pre-process for image-to-video consistency — distinct silhouettes, stable anatomy, unambiguous depth planes. [NB2: use web grounding for accurate ${predator} and ${prey} anatomy and markings.]${descInject}`
      : target === "RUNWAY"
        ? `${vibe.style}, photorealistic, cinematic grade. Built as a stable master reference for Runway I2V continuity — clean separation, readable silhouette, stable anatomy.${descInject}`
        : target === "NANO_BANANA_2"
          ? `${vibe.style}, photorealistic, stable anatomy, clean silhouette separation, strong subject readability for I2V workflows.${descInject}`
          : `${vibe.style}, photorealistic, cinematic grade.${descInject}`;

  return finalizeImagePrompt(`${A} ${B} ${C} ${D} ${E}`, target);
}

// ─────────────────────────────────────────────────────────────
// NEGATIVE PROMPT (Kling / MJ)
// ─────────────────────────────────────────────────────────────
export function buildNegativePrompt(predator: string): string {
  const base =
    "cartoon, CGI look, anime style, unnatural motion, morphing artifacts, " +
    "split screen, floating limbs, jerky movement, watermark, text overlay, " +
    "extra limbs, colour banding, fire, flame, fantasy breath, " +
    "exaggerated vapor glow, energy effect, light beam, glowing mouth, " +
    "smiling, laughing, cartoonish expression, bright unnatural colors";

  const specific: Record<string, string> = {
    Lion: "wrong mane colour, extra mane",
    Tiger: "wrong stripe pattern, blurry markings",
    "Siberian Tiger": "wrong stripe density, tropical setting",
    Leopard: "wrong rosette pattern",
    Jaguar: "wrong spot pattern",
    "Snow Leopard": "wrong spot pattern, short tail",
    Cheetah: "wrong tear marks, thick mane",
    Shark: "cartoon fins",
    Orca: "wrong colour pattern",
    "Komodo Dragon": "wrong scale pattern",
    "Polar Bear": "wrong fur colour, tropical environment",
    Bobcat: "wrong spot pattern, long tail",
    Alligator: "wrong scale pattern, fictional setting",
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
// RUNWAY SHOTS
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

  const qLead = buildQualityLead(quality);
  const refTags = buildReferenceTagBlock(quality);
  const context = sceneDesc?.trim() ? `\nScene continuity: ${sceneDesc.trim().slice(0, 150)}` : "";

  const refLine = quality?.referenceLock
    ? "Use the uploaded master image or previous last frame as the locked reference."
    : "Use the current shot as the visual guide.";

  const motionRule = quality?.motionOnlyI2V
    ? "Motion-only prompt: let the reference image carry coat, markings, and anatomy; describe only movement, physics, and camera."
    : "Appearance text is optional: keep it one short clause; keep motion as the priority.";

  const singleRule = quality?.singleActionRule
    ? "One primary subject action and one camera move only."
    : "Keep motion readable and limited.";

  const gateOn = !!quality?.singleActionRule;
  const beat1 = oneActionArcBeat(arc, "establish", gateOn);
  const beat2 = oneActionArcBeat(arc, "action", gateOn);
  const beat3 = oneActionArcBeat(arc, "aftermath", gateOn);

  return {
    shot1: finalizePrompt(`RUNWAY SHOT 1 — ESTABLISHING [${model}]
${note}
${qLead}
${refTags}
${refLine}
${motionRule}
${singleRule}
${maybeGuard(beat1.guardLine)}${context}

Paste-ready I2V prompt:
Slow dolly-in as ${predator} exhales slowly — ribcage expands and settles, nostrils flare once, ears rotate forward 10°. ${prey} stays fully alert, body rigid and reactive. ${micro}. ${tone.video}.

Camera motion: slow dolly-in.
Subject action: ${predator} ${beat1.predatorBeat}.
Prey reaction: ${prey} ${beat1.preyBeat}.
Environment motion: ${micro}.
Tone: ${tone.video}.
Framing: ${vibe.camera}.`),

    shot2: finalizePrompt(`RUNWAY SHOT 2 — ACTION${gateOn ? " (ONE-ACTION)" : ""} [${model}]
${note}
${qLead}
${refTags}
${refLine}
${motionRule}
${singleRule}
${maybeGuard(beat2.guardLine)}${context}

Paste-ready I2V prompt:
Controlled tracking move as ${predator} ${beat2.predatorBeat}. ${prey} ${beat2.preyBeat}. Ground scatter, foliage response, body-weight transfer. ${micro}.

Camera motion: controlled tracking move.
Subject action: ${predator} ${beat2.predatorBeat}.
Prey reaction: ${prey} ${beat2.preyBeat}.
Environment motion: ground scatter, foliage response, body-weight transfer, ${micro}.
Physics: preserve natural acceleration and deceleration.`),

    shot3: finalizePrompt(`RUNWAY SHOT 3 — AFTERMATH [${model}]
${note}
${qLead}
${refTags}
${refLine}
${motionRule}
${singleRule}
${maybeGuard(beat3.guardLine)}

Paste-ready I2V prompt:
Slow pull-back as ${predator} exhales deeply — ribcage falls, posture resets, stance recovers. Eye-line stays engaged. Residual atmosphere — ${micro}. ${tone.image}.

Camera motion: slow pull-back.
Subject action: ${predator} ${beat3.predatorBeat}.
Prey reaction: ${prey} ${beat3.preyBeat}.
Environment motion: residual atmosphere — ${micro}.
Mood: ${tone.image}.`),
  };
}

// ─────────────────────────────────────────────────────────────
// KLING SHOTS
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

  const qLead = buildQualityLead(quality);
  const refTags = buildReferenceTagBlock(quality);
  const context = sceneDesc?.trim() ? `\nScene continuity: ${sceneDesc.trim().slice(0, 150)}` : "";

  const refLine = quality?.referenceLock
    ? "Reference lock active — preserve the exact subject identity from the input frame."
    : "Preserve overall continuity from the source frame.";

  const motionRule = quality?.motionOnlyI2V
    ? "Motion-only prompting active — do not redescribe the subject's look."
    : "Keep visual restatement minimal.";

  const singleRule = quality?.singleActionRule ? "One action beat only — no stacked actions." : "Keep action focused.";
  const wideRule = klingWidePhysicsRule();

  const gateOn = !!quality?.singleActionRule;
  const beat1 = oneActionArcBeat(arc, "establish", gateOn);
  const beat2 = oneActionArcBeat(arc, "action", gateOn);
  const beat3 = oneActionArcBeat(arc, "aftermath", gateOn);

  return {
    shot1: finalizePrompt(`KLING SHOT 1 — TENSION [${model}]
${note}
${qLead}
${refTags}
${refLine}
${motionRule}
${singleRule}
${maybeGuard(beat1.guardLine)}${context}

Scene: ${env}, ${weatherVariants[weather]}.
Characters: ${predator} drives scene pressure; ${prey} is fully alert and reactive.
Action: ${predator} ${beat1.predatorBeat}. ${prey} ${beat1.preyBeat}.
Camera: subtle handheld drift or static hold.
Environment motion: ${micro}.
Style: ${tone.video}. ${vibe.style}.`),

    shot2: finalizePrompt(`KLING SHOT 2 — STRIKE (WIDE${gateOn ? " + ONE-ACTION" : ""}) [${model}]
${note}
${qLead}
${refTags}
${refLine}
${motionRule}
${singleRule}
${wideRule}
${maybeGuard(beat2.guardLine)}${context}

Scene: ${env}, ${weatherVariants[weather]}.
Action: ${predator} ${beat2.predatorBeat}. ${prey} ${beat2.preyBeat}.
Camera: FIXED WIDE — full bodies visible; no crop; no close-ups.
Environment motion: debris response, surface displacement, ${micro}.
Physics priority: coherent limbs, grounded weight, readable impact.`),

    shot3: finalizePrompt(`KLING SHOT 3 — AFTERMATH (WIDE${gateOn ? " + ONE-ACTION" : ""}) [${model}]
${note}
${qLead}
${refTags}
${refLine}
${motionRule}
${singleRule}
${wideRule}
${maybeGuard(beat3.guardLine)}${context}

Scene: ${env}, ${weatherVariants[weather]}.
Action: ${predator} ${beat3.predatorBeat}. ${prey} ${beat3.preyBeat}.
Camera: LOCKED FIXED WIDE — no movement; full bodies visible.
Environment motion: ${micro}.
Style: ${vibe.style}. ${tone.image}.`),
  };
}

// ─────────────────────────────────────────────────────────────
// KLING NATIVE 15s MULTI-SHOT
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

  const qLead = buildQualityLead(quality);
  const refTags = buildReferenceTagBlock(quality);
  const context = sceneDesc?.trim() ? `\nScene context: ${sceneDesc.trim().slice(0, 150)}` : "";

  const isNative = model === "Kling 3.0 Pro" || model === "Kling 3.0 Standard";

  const refLine = quality?.referenceLock
    ? "Reference lock active — preserve exact subject identity from the input frame across all 3 beats."
    : "Maintain consistent subject appearance, scale, and environment across all 3 beats.";

  const motionRule = quality?.motionOnlyI2V
    ? "Motion-only mode — do not redescribe subject appearance."
    : "Keep visual restatement minimal across all beats.";

  const wideRule = klingWidePhysicsRule();
  const cfgScales = getKlingCfgScales(arc);
  const cfgLine = `CFG Scale: Shot 1 → ${cfgScales.shot1} | Shot 2 → ${cfgScales.shot2} | Shot 3 → ${cfgScales.shot3} (set in Kling settings panel, 0.0–1.0 range)`;

  const gateOn = !!quality?.singleActionRule;
  const b1 = oneActionArcBeat(arc, "establish", gateOn);
  const b2 = oneActionArcBeat(arc, "action", gateOn);
  const b3 = oneActionArcBeat(arc, "aftermath", gateOn);

  const body = `Scene: ${env}, ${weatherVariants[weather]}.
Characters: ${predator} (predator — drives scene pressure). ${prey} (prey — fully reactive throughout).
Emotional tone: ${tone.image}.
${wideRule}

Shot 1 — INITIATION (0–5 seconds):
${maybeGuard(b1.guardLine)}${predator} ${b1.predatorBeat}. ${prey} ${b1.preyBeat}.
Camera: static hold or subtle handheld drift.
Environment motion: ${micro}.

Shot 2 — ESCALATION (5–10 seconds) — WIDE:
${maybeGuard(b2.guardLine)}${predator} ${b2.predatorBeat}. ${prey} ${b2.preyBeat}.
Camera: FIXED WIDE — full bodies visible; no crop; no close-ups.
Environment motion: surface displacement, debris scatter, ${micro}.
Physics priority: grounded weight transfer, coherent limb mechanics, readable impact.

Shot 3 — RESOLUTION (10–15 seconds) — WIDE:
${maybeGuard(b3.guardLine)}${predator} ${b3.predatorBeat}. ${prey} ${b3.preyBeat}.
Camera: LOCKED FIXED WIDE — full bodies visible; no crop; no close-ups.
Environment motion: residual atmosphere — ${micro}.

Overall style: ${vibe.style}. Photorealistic wildlife documentary. 9:16 vertical frame. Arc: ${getSafeArcPrint(arc)}.`;

  if (!isNative) {
    return finalizePrompt(`⚠️ KLING NATIVE 15S: Requires Kling 3.0 Pro or Kling 3.0 Standard.
Selected: ${model}. Switch model to activate.

─────────────────────────────────────
${note}
${qLead}
${refTags}
${refLine}
${motionRule}${context}

${body}`);
  }

  return finalizePrompt(`KLING NATIVE 15-SECOND MULTI-SHOT [${model}]
─────────────────────────────────────────────────────────
${note}
${qLead}
${refTags}
${refLine}
${motionRule}
${cfgLine}${context}

${body}`);
}

// ─────────────────────────────────────────────────────────────
// KLING 6-SHOT MULTI-SCENE
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

  const qLead = buildQualityLead(quality);
  const refTags = buildReferenceTagBlock(quality);
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

  return finalizePrompt(`KLING 6-SHOT MULTI-SCENE [${model}] — Native Single-Prompt Format
──────────────────────────────────────────────────────
${note}
${qLead}
${refTags}
CFG Scale: ${cfgBase} (0.0–1.0 range)
${wideRule}${context}

Scene: ${env}, ${weatherVariants[weather]}.
Characters: ${predator} (drives pressure). ${prey} (fully reactive).
Style: ${vibe.style}. ${tone.image}. Photorealistic wildlife documentary. 9:16 vertical frame.
Story arc: ${getSafeArcPrint(arc)}.

Shot 1 — MACRO CLOSE-UP (0–2s):
${predator} eye fills frame — iris visible, catch light sharp, pupil dilated.
Camera: locked static macro.

Shot 2 — WIDE ESTABLISHING (2–5s):
${predator} LEFT, ${prey} RIGHT, ~10m apart. ${predator} exhales once. ${prey} freezes.
Camera: locked wide.

Shot 3 — PROFILE TRACKING (5–8s):
${predator} shifts weight forward — shoulders compress. ${prey} rises to threat display.
Camera: low side-angle tracking, very slow.

Shot 4 — SHOT-REVERSE-SHOT (8–11s):
Alternating close-ups: ${predator} intensity / ${prey} panic tells.
Camera: no movement.

Shot 5 — ACTION WIDE (11–14s) — WIDE:
${maybeGuard(b5.guardLine)}${predator} ${b5.predatorBeat}. ${prey} ${b5.preyBeat}.
Camera: FIXED WIDE — full bodies visible; no crop; no close-ups.
Environment: debris + ${micro}.

Shot 6 — AFTERMATH WIDE (14–17s) — WIDE:
${maybeGuard(b6.guardLine)}${predator} ${b6.predatorBeat}. ${prey} ${b6.preyBeat}.
Camera: LOCKED FIXED WIDE — full bodies visible; no crop; no close-ups.`);
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
// ─────────────────────────────────────────────────────────────
export function buildClipChaining(predator: string, driftRisk: PredatorInfo["driftRisk"]): string {
  const riskLine =
    driftRisk === "HIGH"
      ? "DRIFT HIGH — reference image on EVERY clip. Weight: 0.6–0.8."
      : driftRisk === "MEDIUM"
        ? "DRIFT MEDIUM — upload reference before each clip."
        : "DRIFT LOW — generate freely.";

  return `CLIP CHAINING — ${predator.toUpperCase()}
${riskLine}

STEP 1 — Generate Shot 1 (Runway establishing) → extract LAST FRAME
STEP 2 — Chain Shot 2 (Kling action): upload last frame as I2V. Motion prompt: movement only.
STEP 3 — Chain Shot 3: upload last frame of Shot 2. Lowest motion strength.

RULE: Subject description WORD-FOR-WORD identical across all clips.`;
}
