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
// KLING 3.0 [WSTV current workflow notes — primary-doc refresh recommended]:
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
  arcCfgScale,
  getKlingCfgScales,
  arcs,
  weatherOptions,
} from "@/lib/model-specs";

import { buildQualityLead } from "@/lib/quality-lead";
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

/** Kling 3.0 current WSTV constraints (primary-doc refresh recommended) */
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
// KLING PROMPT LENGTH VALIDATOR
// ─────────────────────────────────────────────────────────────
export const KLING_CHAR_LIMIT = 2500;

export function validateKlingPromptLength(prompt: string): {
  length: number;
  isOver: boolean;
  remaining: number;
  warning: string | null;
} {
  const length = prompt.length;
  const isOver = length > KLING_CHAR_LIMIT;
  const remaining = KLING_CHAR_LIMIT - length;
  return {
    length,
    isOver,
    remaining,
    warning: isOver
      ? `⚠️ Kling prompt ${length} chars — limit ${Math.abs(remaining)} chars le nacheko. Kling le silently truncate garxa!`
      : null,
  };
}

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
// ─────────────────────────────────────────────────────────────

/** Strips 30fps references from Runway prompts (official: 24/25 only) */
export function sanitizeRunwayFPS(prompt: string): string {
  return prompt.replace(/\b30\s*fps\b/gi, "").replace(/\b30fps\b/gi, "").trim();
}

/** Strips negative-prompt-like phrasing from Runway prompts */
export function sanitizeRunwayNegative(prompt: string): string {
  const negativeStart = /^(?:no|never|avoid|do not|don't)\b/i;

  const sentences = prompt.match(/[^.!?]+[.!?]?/g) ?? [prompt];

  const kept = sentences.filter((sentence) => {
    const trimmed = sentence.trim();
    if (!trimmed) return false;

    const normalized = trimmed.replace(/^[–—-]\s*/, "");
    if (!negativeStart.test(normalized)) return true;

    const body = normalized.replace(/[.!?]+$/, "");
    const parts = body
      .split(/[;,]/)
      .map((part) => part.trim())
      .filter(Boolean);

    const allNegative =
      parts.length > 0 && parts.every((part) => negativeStart.test(part));

    return !allNegative;
  });

  return kept
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;!?])/g, "$1")
    .trim();
}

/** Full Runway prompt sanitizer (apply before final output) */
export function sanitizeRunwayPrompt(prompt: string): string {
  const a = sanitizeRunwayFPS(prompt);
  const b = sanitizeRunwayNegative(a);
  return b.replace(/\s{2,}/g, " ").trim();
}

// ─────────────────────────────────────────────────────────────
// KLING 3.0 MOTION INTENSITY CALCULATOR
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
      return Math.max(0.1, base - 0.25);
    case "action":
      return Math.min(1.0, base + 0.15);
    case "aftermath":
      return Math.max(0.1, base - 0.2);
    default:
      return base;
  }
}

// ─────────────────────────────────────────────────────────────
// SAFE ARC LABELS
// ─────────────────────────────────────────────────────────────
const ARC_SAFE_LABEL: Record<string, string> = {
  "Chase and takedown": "chase sequence",
  "Ambush attack": "ambush sequence",
  "Escape from danger": "escape sequence",
  "Territory dominance battle": "dominance encounter",
  "Predator vs predator fight": "predator confrontation",
  "Pack hunting strategy": "Pack hunting strategy",
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
// KLING HELPER LINES
// ─────────────────────────────────────────────────────────────
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
  const cleanEnv = sanitizeImageEnv(env);
  const cleanWeather = sanitizeWeatherPhrase(weatherVariants[weather]);

  return motionOnlyI2V
    ? `Lighting & Location: same environment continuity, ${cleanWeather}.`
    : `Lighting & Location: ${cleanEnv}, ${cleanWeather}.`;
}

function buildKlingExtraLine(base: string, motionOnlyI2V?: boolean): string {
  return motionOnlyI2V ? base : `${base}.`;
}
function formatActionSubject(subject: string, beat: string): string {
  if (subject === "Wolf Pack") {
    return `The pack ${beat}`;
  }
  return `${subject} ${beat}`;
}

// ─────────────────────────────────────────────────────────────
// Kling WIDE PHYSICS RULE
// ─────────────────────────────────────────────────────────────
function klingWidePhysicsRule(): string {
  return "WIDE PHYSICS RULE — Shot 2 and Shot 3 must be FIXED WIDE (full bodies visible) to preserve biomechanics, weight transfer, and collision readability. Kling 3.0's 4K output ensures micro-detail even in wide framing.";
}

// ─────────────────────────────────────────────────────────────
// HABITAT MODE HELPERS
// ─────────────────────────────────────────────────────────────
type HabitatMode = "land" | "aquatic" | "shoreline";

function isAquaticEnv(env: string): boolean {
  const envLower = env.toLowerCase();
  return (
    envLower.includes("water") ||
    envLower.includes("river") ||
    envLower.includes("lake") ||
    envLower.includes("swamp") ||
    envLower.includes("ocean") ||
    envLower.includes("sea") ||
    envLower.includes("reef") ||
    envLower.includes("coast") ||
    envLower.includes("shore") ||
    envLower.includes("underwater") ||
    envLower.includes("marine")
  );
}

function isAquaticAnimal(name: string): boolean {
  const n = name.toLowerCase();
  return [
    "shark",
    "orca",
    "dolphin",
    "seal",
    "fish",
    "whale",
    "octopus",
    "squid",
    "sea lion",
    "walrus",
    "penguin",
    "otter",
    "crocodile",
    "alligator",
    "caiman",
    "hippo",
  ].some((x) => n.includes(x));
}

function isSemiAquaticPredator(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("crocodile") || n.includes("alligator") || n.includes("caiman");
}

function getHabitatMode(predator: string, prey: string, env: string): HabitatMode {
  const envAquatic = isAquaticEnv(env);
  const predatorAquatic = isAquaticAnimal(predator);
  const preyAquatic = isAquaticAnimal(prey);
  const semiAquaticPred = isSemiAquaticPredator(predator);

  if (predatorAquatic && preyAquatic && envAquatic) return "aquatic";
  if (semiAquaticPred && !preyAquatic) return "shoreline";
  if (envAquatic && predatorAquatic && !preyAquatic) return "shoreline";
  return "land";
}

// ─────────────────────────────────────────────────────────────
// ONE-ACTION HARD GATE
// ─────────────────────────────────────────────────────────────
function oneActionArcBeat(
  arc: Arc,
  beat: "establish" | "action" | "aftermath",
  enabled: boolean,
  habitatMode: HabitatMode = "land"
): { predatorBeat: string; preyBeat: string; guardLine: string } {
  if (habitatMode === "aquatic") {
    const baseGuard =
      "ONE-ACTION GATE — one primary predator action + one prey reaction only (no stacked beats).";

    if (!enabled) {
      if (beat === "action") {
        return {
          predatorBeat: "commits to one clear forward surge through the water",
          preyBeat: "answers with one readable evasive dart",
          guardLine: "",
        };
      }
      if (beat === "aftermath") {
        return {
          predatorBeat: "slows and settles into a controlled glide",
          preyBeat: "repositions once and holds distance in the current, fully alert",
          guardLine: "",
        };
      }
      return {
        predatorBeat: "holds a coiled pre-strike glide with restrained movement",
        preyBeat: "locks attention and holds a tense hover once",
        guardLine: "",
      };
    }

    switch (arc) {
      case "Chase and takedown":
        if (beat === "action") {
          return {
            predatorBeat: "accelerates into a single chase surge through the water",
            preyBeat: "breaks into one clean escape dart with one evasive direction change",
            guardLine: `${baseGuard}\nChase gate: this shot is chase-only (no capture/contact actions).`,
          };
        }
        if (beat === "aftermath") {
          return {
            predatorBeat: "slows into a controlled glide as turbulence fades",
            preyBeat: "repositions once and holds distance, fully alert",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat: "holds a coiled pre-chase glide with restrained movement",
          preyBeat: "locks attention and freezes once in the water column",
          guardLine: baseGuard,
        };

      case "Ambush attack":
        if (beat === "action") {
          return {
            predatorBeat: "launches once from cover with one decisive forward surge",
            preyBeat: "reacts once with a sharp evasive dart and turn",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat:
            beat === "aftermath"
              ? "settles into a slower glide as the water stabilizes"
              : "compresses into a low-tension glide, movement tightly controlled",
          preyBeat:
            beat === "aftermath"
              ? "stabilizes position once, still alert"
              : "stiffens and locks attention once",
          guardLine: baseGuard,
        };

      case "Escape from danger":
        if (beat === "action") {
          return {
            predatorBeat: "commits once toward the target with a single pressure surge",
            preyBeat: "executes one desperate escape burst through the water",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat:
            beat === "aftermath"
              ? "halts forward pressure and glides once, fully aware"
              : "builds pressure without closing distance",
          preyBeat:
            beat === "aftermath"
              ? "regains stable position once, still tense"
              : "tenses and prepares to flee",
          guardLine: baseGuard,
        };

      case "Territory dominance battle":
        if (beat === "action") {
          return {
            predatorBeat: "presses forward once in a controlled dominance surge",
            preyBeat: "answers once with a single threat display or retreating shift",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat:
            beat === "aftermath"
              ? "holds position and settles into a composed glide"
              : "holds space with still dominance",
          preyBeat:
            beat === "aftermath"
              ? "holds distance, posture tight"
              : "stays tense, watching",
          guardLine: baseGuard,
        };

      case "Predator vs predator fight":
        if (beat === "action") {
          return {
            predatorBeat: "commits one forward pressure beat with a single clash moment",
            preyBeat: "responds once with one counter-shift or recoil",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat:
            beat === "aftermath"
              ? "resets spacing and settles into a controlled glide"
              : "circles pressure slowly without contact",
          preyBeat:
            beat === "aftermath"
              ? "rebalances once, eyes locked"
              : "mirrors spacing, ready",
          guardLine: baseGuard,
        };

      case "Pack hunting strategy":
        if (beat === "action") {
          return {
            predatorBeat: "tightens formation once with one coordinated lateral close-in",
            preyBeat: "reacts once by pivoting toward one escape lane",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat:
            beat === "aftermath"
              ? "holds formation and eases into a steady glide"
              : "maintains disciplined spacing",
          preyBeat:
            beat === "aftermath"
              ? "holds distance, still tense"
              : "stays alert, scanning",
          guardLine: baseGuard,
        };

      case "Defender stands ground":
        if (beat === "action") {
          return {
            predatorBeat: "drives one decisive forward defense surge",
            preyBeat: "reacts once with one recoil or lateral slip",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat:
            beat === "aftermath"
              ? "holds position as motion settles"
              : "holds a planted defensive line in the water",
          preyBeat:
            beat === "aftermath"
              ? "keeps distance, posture tight"
              : "tests space, cautious",
          guardLine: baseGuard,
        };

      case "Giant vs giant clash":
        if (beat === "action") {
          return {
            predatorBeat: "loads pressure and commits one heavy clash beat",
            preyBeat: "responds once with one grounded shove or recoil through the water",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat:
            beat === "aftermath"
              ? "settles mass and eases into a slower glide"
              : "approaches slowly with heavy pressure through the water",
          preyBeat:
            beat === "aftermath"
              ? "rebalances once, still tense"
              : "holds ground, ready",
          guardLine: baseGuard,
        };

      default:
        return {
          predatorBeat:
            beat === "action"
              ? "commits to one clear forward surge"
              : "holds tension with controlled movement",
          preyBeat:
            beat === "action"
              ? "answers with one survival reaction"
              : "stays alert and reactive",
          guardLine: baseGuard,
        };
    }
  }

  if (habitatMode === "shoreline") {
    const baseGuard =
      "ONE-ACTION GATE — one primary predator action + one prey reaction only (no stacked beats).";

    if (!enabled) {
      if (beat === "action") {
        return {
          predatorBeat: "commits to one explosive shoreline surge from the water's edge",
          preyBeat: "answers with one sharp evasive leap or turn",
          guardLine: "",
        };
      }
      if (beat === "aftermath") {
        return {
          predatorBeat: "settles low at the waterline as disturbed water fades",
          preyBeat: "repositions once on unstable footing, still fully alert",
          guardLine: "",
        };
      }
      return {
        predatorBeat: "holds a low concealed ambush posture at the water's edge",
        preyBeat: "locks attention and stiffens once near the bank",
        guardLine: "",
      };
    }

    switch (arc) {
      case "Ambush attack":
        if (beat === "action") {
          return {
            predatorBeat: "launches once from the waterline with one decisive forward surge",
            preyBeat: "reacts once with a sharp evasive jump and turn away from the bank",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat:
            beat === "aftermath"
              ? "settles low at the edge as splash and mud disturbance fade"
              : "compresses low in concealment at the water's edge, breath controlled",
          preyBeat:
            beat === "aftermath"
              ? "stabilizes footing once, still alert"
              : "stiffens and locks attention once",
          guardLine: baseGuard,
        };

      case "Chase and takedown":
        if (beat === "action") {
          return {
            predatorBeat: "bursts once from the edge with one grounded pursuit lunge",
            preyBeat: "breaks into one desperate escape sprint with one lane change",
            guardLine: `${baseGuard}\nChase gate: this shot is chase-only (no contact/capture actions).`,
          };
        }
        if (beat === "aftermath") {
          return {
            predatorBeat: "slows at the edge and resets posture with one heavy breath release",
            preyBeat: "repositions once and holds distance, fully alert",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat: "holds a coiled shoreline pre-chase stance",
          preyBeat: "locks attention and freezes once",
          guardLine: baseGuard,
        };

      default:
        if (beat === "action") {
          return {
            predatorBeat: "commits to one decisive shoreline surge",
            preyBeat: "answers with one readable survival reaction",
            guardLine: baseGuard,
          };
        }
        if (beat === "aftermath") {
          return {
            predatorBeat: "settles posture at the edge as water and debris calm down",
            preyBeat: "repositions once and holds distance, fully alert",
            guardLine: baseGuard,
          };
        }
        return {
          predatorBeat: "holds tension in a low shoreline ambush posture",
          preyBeat: "stays alert and reactive",
          guardLine: baseGuard,
        };
    }
  }

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
            ? "settles posture once, stance recovered"
            : "compresses low and still, breath controlled",
        preyBeat:
          beat === "aftermath"
            ? "stabilizes footing once, still alert"
            : "stiffens and locks attention once",
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
        predatorBeat:
          beat === "aftermath"
            ? "halts and scans once, breath visible"
            : "builds pressure without advancing",
        preyBeat:
          beat === "aftermath"
            ? "regains footing once, still tense"
            : "tenses and prepares to flee",
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
        predatorBeat:
          beat === "aftermath"
            ? "stands composed and exhales once"
            : "holds ground with still dominance",
        preyBeat:
          beat === "aftermath"
            ? "holds distance, posture tight"
            : "stays tense, watching",
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
        predatorBeat:
          beat === "aftermath"
            ? "resets stance and exhales once"
            : "circles pressure slowly without contact",
        preyBeat:
          beat === "aftermath"
            ? "rebalances once, eyes locked"
            : "mirrors stance, ready",
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
        predatorBeat:
  beat === "aftermath"
    ? "holds formation and settles once"
    : "maintains disciplined spacing",
        preyBeat:
          beat === "aftermath"
            ? "holds distance, still tense"
            : "stays alert, scanning",
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
        predatorBeat:
          beat === "aftermath"
            ? "stands firm, breath settling"
            : "plants stance, head lowered",
        preyBeat:
          beat === "aftermath"
            ? "keeps distance, posture tight"
            : "tests space, cautious",
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
        predatorBeat:
          beat === "aftermath"
            ? "settles weight and exhales once"
            : "approaches slowly with heavy weight transfer",
        preyBeat:
          beat === "aftermath"
            ? "rebalances once, still tense"
            : "holds ground, ready",
        guardLine: baseGuard,
      };

    default:
      return {
        predatorBeat:
          beat === "action"
            ? "commits to one clear movement beat"
            : "holds tension with controlled breath",
        preyBeat:
          beat === "action"
            ? "answers with one survival reaction"
            : "stays alert and reactive",
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
  const isAquatic =
    envLower.includes("water") ||
    envLower.includes("river") ||
    envLower.includes("lake") ||
    envLower.includes("swamp") ||
    envLower.includes("ocean") ||
    envLower.includes("sea") ||
    envLower.includes("reef") ||
    envLower.includes("coast") ||
    envLower.includes("shore") ||
    envLower.includes("underwater") ||
    envLower.includes("marine");

  const isArctic =
    envLower.includes("arctic") ||
    envLower.includes("snow") ||
    envLower.includes("tundra") ||
    envLower.includes("ice") ||
    envLower.includes("glacier") ||
    envLower.includes("frozen") ||
    envLower.includes("winter");

  if (isAquatic) {
    if (weather === "Storm") {
      return "choppy surface movement, wave slap, underwater particulate drift, foam disturbance, current-driven motion";
    }
    if (weather === "Golden Hour") {
      return "surface ripples catching warm light, gentle wave movement, shifting caustic reflections, suspended particles drifting in water";
    }
    if (weather === "Winter Blizzard" || weather === "Frozen Dusk") {
      return "cold surface disturbance, drifting ice particles, subtle current movement, freezing water atmosphere";
    }
    return "water ripples, current-driven movement, shifting surface reflections, suspended particles drifting naturally";
  }

  if (isArctic) {
    if (weather === "Golden Hour") {
      return "subtle frozen-brush sway, light fur movement, clean cold-air stillness, gentle pine movement in warm backlight";
    }
    return "subtle frozen-ground movement, light fur movement, clean cold-air stillness, faint terrain movement across frozen ground";
  }

  if (weather === "Winter Blizzard" || weather === "Frozen Dusk") {
    return "subtle frozen-brush sway, light fur movement, clean cold-air stillness, faint distant brush movement";
  }

  if (weather === "Storm") {
    return "wind pressure through foliage, rain disturbance, loose surface response reacting to gusts";
  }

  if (weather === "Golden Hour") {
    return "subtle grass sway, light fur movement, stable clean air, gentle background vegetation movement";
  }

  return "subtle foliage sway, stable clean air, light environmental reaction around the subjects";
}

// ─────────────────────────────────────────────────────────────
// KLING 3.0 NATIVE AUDIO PROMPT BUILDER
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
  const habitatMode = getHabitatMode(predator, prey, env);
  const isAquatic = habitatMode === "aquatic";
  const isShoreline = habitatMode === "shoreline";

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
  if (isArcticLike) {
    ambient = "cold mountain wind through pines, distant winter forest hush, snow underfoot atmosphere";
  } else {
    ambient = "distant bird calls, rustling canopy, layered forest ambience";
  }
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
          ? `${predator} restrained low movement at the water's edge, subtle body pressure in the shallows, ${prey} tense footing adjustment near the bank`
          : `${predator} slow controlled breathing through nostrils, ${prey} alert stillness with occasional tension exhale`;
      break;
    case "action":
      animalAudio = isAquatic
        ? `${predator} explosive water displacement, rapid current turbulence, ${prey} frantic splash or dart movement, bubble and spray burst`
        : isShoreline
          ? `${predator} explosive surge from the shoreline, shallow splash burst, mud scatter, ${prey} frantic leap or turn on unstable ground`
          : `heavy ground impact from ${predator} movement, explosive burst sounds, ${prey} distress vocalization, debris scatter`;
      break;
    case "aftermath":
      animalAudio = isAquatic
        ? `${predator} slower water movement settling, residual turbulence fading, ${prey} cautious repositioning through the water`
        : isShoreline
          ? `${predator} slower edge movement settling, residual splash fading, ${prey} cautious repositioning on wet unstable ground`
          : `${predator} heavy rhythmic breathing settling, terrain debris settling, ${prey} cautious repositioning footsteps`;
      break;
  }

  return finalizePrompt(
    `Audio: ${ambient}${weatherAudio}. ${animalAudio}. No music. Documentary field recording quality.`
  );
}

// ─────────────────────────────────────────────────────────────
// KLING AUDIO — SHORT VERSION (paste-ready core only, <120 chars per line)
// ─────────────────────────────────────────────────────────────
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
  const envLower = env.toLowerCase();

  const isArcticLike =
    envLower.includes("arctic") || envLower.includes("snow") ||
    envLower.includes("tundra") || envLower.includes("ice") ||
    envLower.includes("glacier") || envLower.includes("frozen") ||
    envLower.includes("winter");

  const weatherTag =
    weather === "Winter Blizzard" ? "blizzard wind, snow surfaces" :
    weather === "Storm" ? "storm wind, rain" :
    weather === "Golden Hour" ? "warm twilight stillness" :
    weather === "Frozen Dusk" ? "frozen silence, crystalline wind" :
    "ambient wind";

  const ambientTag =
    isAquatic ? "water current, surface movement" :
    isShoreline ? "shoreline wash, wet bank" :
    isArcticLike ? "arctic wind, frozen ground" :
    envLower.includes("forest") ? "forest ambience, canopy" :
    envLower.includes("savanna") || envLower.includes("grassland") ? "dry wind, insect drone" :
    "terrain ambience";

  const animalTag =
    beat === "establish" ? `${predator} controlled breathing, ${prey} alert stillness` :
    beat === "action"    ? `${predator} impact, ${prey} distress vocalization, debris` :
                           `${predator} breathing settling, ${prey} cautious repositioning`;

  return finalizePrompt(`Audio: ${ambientTag}, ${weatherTag}. ${animalTag}. No music.`);
}

// ─────────────────────────────────────────────────────────────
// QUALITY SUMMARY
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// REFERENCE WORKFLOW
// ─────────────────────────────────────────────────────────────
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
  • Runway: Extract previous last frame → use as new I2V input.
  • Kling: Re-upload master image with Bind Subject enabled.
STEP 7 — For Kling 3.0: Optionally set End Frame to guide the final tension pose.`);
}

// ─────────────────────────────────────────────────────────────
// NATURALISM CHECKLIST
// ─────────────────────────────────────────────────────────────
export function buildNaturalismChecklist(opts: QualityOptions, weather: Weather, env: string): string[] {
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
      ? "Regenerate from the master frame or previous last frame to preserve silhouette, spacing, and subject readability across clips."
      : "Expect more visual variation and weaker identity stability without reference lock.",
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
function sanitizeImageEnv(env: string): string {
  return String(env ?? "")
    .replace(/\s*with geothermal steam/gi, "")
    .replace(/\bgeothermal steam\b/gi, "")
    .replace(/\bsteam vents?\b/gi, "")
    .replace(/\bsmoke plumes?\b/gi, "")
    .replace(/\bmist\b/gi, "")
    .replace(/\bhaze\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}
function sanitizeWeatherPhrase(phrase: string): string {
  return String(phrase ?? "")
    .replace(/\bbreath steam visible\b/gi, "clean cold-air clarity")
    .replace(/\bvisible breath vapor\b/gi, "clean cold-air clarity")
    .replace(/\bbreath vapor\b/gi, "clean cold-air clarity")
    .replace(/\bbreath clouds\b/gi, "clean cold-air clarity")
    .replace(/\bsteam\b/gi, "")
    .replace(/\bmist\b/gi, "")
    .replace(/\bhaze\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*\./g, ".")
    .trim();
}
function isArcticEnv(env: string): boolean {
  const s = String(env ?? "").toLowerCase();
  return (
    s.includes("snow") ||
    s.includes("tundra") ||
    s.includes("ice") ||
    s.includes("glacier") ||
    s.includes("frozen") ||
    s.includes("winter") ||
    s.includes("arctic")
  );
}

function sanitizeImageTexture(texture: string, env: string): string {
  const isArctic = isArcticEnv(env);

  let out = String(texture ?? "")
    .replace(/\bdust on hooves\b/gi, "clean hooves")
    .replace(/\bvisible breath plumes\b/gi, "clean muzzle detail")
    .replace(/\bvisible breath vapor\b/gi, "clean muzzle detail")
    .replace(/\bbreath plumes\b/gi, "clean muzzle detail")
    .replace(/\bbreath vapor\b/gi, "clean muzzle detail")
    .replace(/\bsmoke\b/gi, "")
    .replace(/\bmist\b/gi, "")
    .replace(/\bhaze\b/gi, "");

  if (isArctic) {
    out = out
      .replace(/\bsnow kicked from paws\b/gi, "clean snow contact around paws, no kicked-up snow")
      .replace(/\bkicked-up snow\b/gi, "clean snow contact")
      .replace(/\bkicked up snow\b/gi, "clean snow contact")
      .replace(/\bpowder movement\b/gi, "clean snow surface")
      .replace(/\bpowder spray\b/gi, "clean snow surface")
      .replace(/\bdust\b/gi, "clean ground-contact detail");
  } else {
    out = out
      .replace(/\bsnow kicked from paws\b/gi, "natural paw contact with grass and uneven ground")
      .replace(/\bkicked-up snow\b/gi, "natural ground-contact detail")
      .replace(/\bkicked up snow\b/gi, "natural ground-contact detail")
      .replace(/\bpowder movement\b/gi, "natural ground-contact detail")
      .replace(/\bpowder spray\b/gi, "natural ground-contact detail")
      .replace(/\bfrost on guard hairs\b/gi, "sunlit guard hairs")
      .replace(/\bicy fur detail\b/gi, "clean realistic fur texture")
      .replace(/\bsharp icy fur detail\b/gi, "clean realistic fur texture")
      .replace(/\bclean snow contact around paws\b/gi, "natural paw contact with grass and uneven ground")
      .replace(/\bsnow contact around paws\b/gi, "natural paw contact with grass and uneven ground")
      .replace(/\bsnow contact\b/gi, "natural ground-contact detail")
      .replace(/\bdust\b/gi, "clean ground-contact detail");
  }

  return out
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*\./g, ".")
    .trim();
}

function sanitizeCameraGearForHabitat(cameraGear: string, env: string): string {
  const isArctic = isArcticEnv(env);

  let out = String(cameraGear ?? "");

  if (!isArctic) {
    out = out
      .replace(/\bacross snow\b/gi, "across open terrain")
      .replace(/\bover snow\b/gi, "over open terrain")
      .replace(/\bon snow\b/gi, "on open terrain")
      .replace(/\bsnowfield\b/gi, "open field")
      .replace(/\bicy\b/gi, "clean")
      .replace(/\bfrozen\b/gi, "open");
  }

  return out
    .replace(/\s{2,}/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .trim();
}

function sanitizeVideoBeatText(text: string): string {
  return String(text ?? "")
    .replace(/\bexhales once\b/gi, "settles once")
    .replace(/\bbreath settling\b/gi, "posture settling")
    .replace(/\bbreath visible\b/gi, "posture tight and controlled")
    .replace(/\bheavy breath release\b/gi, "controlled reset")
    .replace(/\bbreath controlled\b/gi, "movement controlled")
    .trim();
}
// ─────────────────────────────────────────────────────────────
// IMAGE PROMPT
// ─────────────────────────────────────────────────────────────
function buildImageSubjectLine(
  predator: string,
  prey: string,
  arcPhrase: string,
  arc: string
): string {
  const exactGroupMap: Record<string, string> = {
    "Wolf Pack": "three wolves",
  };

  const exactSingleMap: Record<string, string> = {
    Elk: "one elk",
  };

  const predatorLabel =
    exactGroupMap[predator] ?? exactSingleMap[predator] ?? predator;

  const preyLabel =
    exactGroupMap[prey] ?? exactSingleMap[prey] ?? prey;

  const visibility =
    exactGroupMap[predator] || exactGroupMap[prey]
      ? "all fully visible"
      : "both fully visible";

  const usesPredatorPreyRoles =
    arc === "Ambush attack" ||
    arc === "Chase and takedown" ||
    arc === "Pack hunting strategy" ||
    arc === "Escape from danger";

  if (usesPredatorPreyRoles) {
    const predatorSide = exactGroupMap[predator]
      ? "predator group on the left"
      : "predator on the left";

    const preySide = exactGroupMap[prey]
      ? "prey group on the right"
      : "prey on the right";

    return `Subject: ${predatorLabel} and ${preyLabel}, ${visibility}, ${predatorSide} and ${preySide}, locked in the peak tension beat of ${arcPhrase}.`;
  }

  return `Subject: ${predatorLabel} on the left and ${preyLabel} on the right, ${visibility}, locked in the peak tension beat of ${arcPhrase}.`;
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
  target: ImagePromptTarget = "NB2"
): string {
  const depth = getDepthPrompt(depthMode);
  const vibe = animalVibePrompt[animalVibe];
  const cleanEnv = sanitizeImageEnv(env);
const cleanTexture = sanitizeImageTexture(texture, env);
const cleanWeather = sanitizeWeatherPhrase(weatherVariants[weather]);
const cleanCameraGear = sanitizeCameraGearForHabitat(cameraGear, env);
    const cleanAir =
    "clear clean air, no visible steam, no smoke plumes, no mist, no airborne haze, clean subject separation";

  const cam =
  target === "NB2" || target === "NANO_BANANA_2"
    ? cleanCameraGear
    : getFilmStock(cleanCameraGear, lighting, weather);

  const descInject = sceneDesc?.trim() ? `\n\nScene context: ${sceneDesc.trim()}` : "";
  const qLead = "";

  const realismAdd =
    quality?.realismMode === "High Naturalism"
      ? "Biological imperfections visible — stray hairs, uneven fur breakup, natural surface wear, moisture, asymmetrical detail, realistic paw pressure, true contact shadows."
      : quality?.realismMode === "Reference Locked"
        ? "Built as a master reference image for image-to-video continuity — stable silhouette, locked anatomy, readable markings, clean foreground/background separation."
        : "Balanced realism with stable anatomy, natural texture, and clean silhouette separation.";

  const habitatMode = getHabitatMode(predator, prey, env);

    const A =
    habitatMode === "aquatic"
      ? `${predator} and ${prey} both clearly readable in the same frame at the most tension-rich beat of the ${getSafeArcLabel(arc)} scene. ${predator} holds controlled pressure through the water column, ${prey} stays fully alert and reactive, immediate visible tension, no empty setup.`
      : habitatMode === "shoreline"
        ? `${predator} and ${prey} both clearly readable near the waterline at the most tension-rich beat of the ${getSafeArcLabel(arc)} scene. ${predator} stays low at the bank, ${prey} holds full survival awareness, immediate visible tension, no empty setup.`
        : `${predator} and ${prey} both clearly readable in the same frame at the most tension-rich beat of the ${getSafeArcLabel(arc)} scene. ${predator} holds a controlled pre-action posture, ${prey} stays fully alert and reactive, immediate visible tension, no empty setup.`;

        const C = `Wide cinematic wildlife documentary composition, 9:16 vertical frame. Camera: ${cam}, ${depth.lensNote}. ${vibe.camera}. Depth of field: ${depth.depth}. Telephoto compression and documentary framing. Lighting: ${cleanWeather}. Natural rim separation, realistic shadow direction, crisp visibility, true-to-life exposure rolloff, no atmospheric plumes.`;
          const B = `${cleanEnv}, ${cleanWeather}, ${cleanAir}. Layered foreground, readable midground, softened background separation for stable depth maps. Subjects in authentic wildlife behavioral postures, biologically accurate spacing, natural environmental context, immediate readable tension, no empty dead space.`;
        const D = `${cleanTexture}. ${vibe.texture}. Micro-detail visible in fur, skin, feathers, moisture, and clean ground contact. ${realismAdd}`;

  if (target === "NB2") {
        const B_ref = `${cleanEnv}, ${cleanWeather}, ${cleanAir}. Two-plane composition: foreground subjects fully separated from background, unambiguous silhouettes, stable depth map. Subjects placed for clear biomechanical readability, strong first-frame readability, no overlap, each animal fully visible, no empty dead space.`;
    const E_ref = `${vibe.style}, photorealistic, 8K RAW. Optimised for I2V reference consistency — distinct silhouettes, locked anatomy, stable depth planes.${descInject}`;
    return finalizeImagePrompt(`${qLead} ${A} ${B_ref} ${C} ${D} ${E_ref}`, target);
  }

  // House structure aligned to Gemini image-generation guidance:
  // start with clear subject/context/action, then add composition,
  // lighting, and style details for stronger visual control.
    if (target === "NANO_BANANA_2") {
    const nb2Air = "clear clean air, crisp subject separation, stable atmosphere";
    const nb2Optics =
      depthMode === "Cinematic Blur"
        ? "telephoto compression and strong shallow depth separation"
        : depthMode === "Balanced Depth"
          ? "telephoto compression with balanced depth separation and readable midground"
          : "documentary telephoto perspective with deeper field clarity and readable habitat layers";

    const nb2SceneTail = sceneDesc?.trim() ? ` ${sceneDesc.trim()}` : "";

    const subjectLine =
      habitatMode === "aquatic"
        ? `${predator} and ${prey} in the same frame at the most tension-rich beat of the ${getSafeArcLabel(arc)} in ${cleanEnv}.`
        : habitatMode === "shoreline"
          ? `${predator} and ${prey} locked in a shoreline ${getSafeArcLabel(arc)} beat at ${cleanEnv}.`
          : `${predator} and ${prey} in a tense ${getSafeArcLabel(arc)} moment in ${cleanEnv}.`;

    const actionLine =
      habitatMode === "aquatic"
        ? `${predator} applies visible pressure through the water on the left while ${prey} stays fully alert and reactive on the right. Both subjects remain clearly readable with biologically accurate spacing and immediate visible tension.`
        : habitatMode === "shoreline"
          ? `${predator} holds visible pre-action pressure at the waterline on the left while ${prey} stays fully alert near the bank on the right. Both subjects remain clearly readable with natural shoreline spacing and immediate visible tension.`
          : `${predator} holds visible pre-action pressure on the left while ${prey} stays fully alert and reactive on the right. Both subjects remain clearly readable with biologically accurate spacing and immediate visible tension.`;

    const compositionLine = `Wide cinematic wildlife documentary composition in a 9:16 vertical frame, built for a strong mobile-first opening image. Full-body readability, stable silhouette separation, readable terrain layers, and no empty dead space. ${nb2Optics}. Depth of field: ${depth.depth}.`;

    const lightingLine = `${cleanWeather}. ${nb2Air}. Natural rim separation, realistic shadow direction, true-to-life exposure rolloff, and clean first-frame readability.`;

    const styleLine = `Photorealistic wildlife documentary realism. ${cleanTexture}. ${vibe.texture}. Natural fur, skin, feather, moisture, and ground-contact detail. True-to-life color, biologically accurate anatomy, and strong subject clarity. ${realismAdd}${nb2SceneTail}`;

    return finalizeImagePrompt(
      `${qLead} ${subjectLine} ${actionLine} ${compositionLine} ${lightingLine} ${styleLine}`,
      target
    );
  }

  if (target === "RUNWAY") {
        const E_runway = `${vibe.style}, photorealistic, cinematic grade. Built as a stable master reference for Runway Gen-4.5 I2V continuity — clean separation, readable silhouette, stable anatomy, strong first-frame readability, immediate visible tension. High-quality input free of visual artifacts for best I2V results.${descInject}`;
    return finalizeImagePrompt(`${qLead} ${A} ${B} ${C} ${D} ${E_runway}`, target);
  }

  const E = `${vibe.style}, photorealistic, cinematic grade.${descInject}`;
  return finalizeImagePrompt(`${qLead} ${A} ${B} ${C} ${D} ${E}`, target);
}

// ─────────────────────────────────────────────────────────────
// NEGATIVE PROMPT
// ─────────────────────────────────────────────────────────────
export function buildNegativePrompt(predator: string): string {
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

// ─────────────────────────────────────────────────────────────
// THUMBNAIL PROMPT
// ─────────────────────────────────────────────────────────────
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
  `In the wild heart of ${sanitizeImageEnv(env)}, ${withArticle(predator)} and ${withArticle(prey)} share the same moment. ${tone.voiceover}`
);
}

// ─────────────────────────────────────────────────────────────
// RUNWAY SHOTS — GEN-4.5 OFFICIAL FORMAT
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
  const micro = buildMicroMotionLine(weather, env);
  const habitatMode = getHabitatMode(predator, prey, env);
  const isAquatic = habitatMode === "aquatic";
  const isShoreline = habitatMode === "shoreline";

  const qLead = buildQualityLead(quality, "runway");
  const context = sceneDesc?.trim() ? `\nScene continuity: ${sceneDesc.trim().slice(0, 150)}` : "";

  const refLine = quality?.referenceLock
    ? "Use the uploaded master image or previous last frame as the locked reference."
    : "Use the current shot as the visual guide.";

  const motionRule = quality?.motionOnlyI2V
    ? "⚠️ RUNWAY I2V RULE (Official): Image carries ALL identity (coat, markings, anatomy). This prompt describes MOTION, CAMERA, and PHYSICS only. Do NOT restate subject appearance — doing so reduces motion quality."
    : "Keep appearance text minimal; motion is the priority.";

  const singleRule = quality?.singleActionRule
    ? "One primary subject action and one camera move only."
    : "Keep motion readable and limited.";

  const seamless = quality?.seamlessShot ? "Continuous, seamless shot." : "";

  const gateOn = !!quality?.singleActionRule;
  const beat1 = oneActionArcBeat(arc, "establish", gateOn, habitatMode);
  const beat2 = oneActionArcBeat(arc, "action", gateOn, habitatMode);
  const beat3 = oneActionArcBeat(arc, "aftermath", gateOn, habitatMode);

  const s1 = {
    ...beat1,
    predatorBeat: sanitizeVideoBeatText(beat1.predatorBeat),
    preyBeat: sanitizeVideoBeatText(beat1.preyBeat),
  };

  const s2 = {
    ...beat2,
    predatorBeat: sanitizeVideoBeatText(beat2.predatorBeat),
    preyBeat: sanitizeVideoBeatText(beat2.preyBeat),
  };

  const s3 = {
    ...beat3,
    predatorBeat: sanitizeVideoBeatText(beat3.predatorBeat),
    preyBeat: sanitizeVideoBeatText(beat3.preyBeat),
  };

   const shot1PasteReady = sanitizeRunwayFPS(
    isAquatic
      ? `Wide opening hold with a subtle push-in. Keep both subjects fully readable from frame one. The left subject glides once with controlled forward pressure through the water. The right subject holds tense position with locked eye-line. Clear spacing, readable threat line, clean motion start. ${micro}. ${seamless}`.trim()
      : isShoreline
        ? `Wide opening hold with a subtle push-in. Keep both subjects fully readable from frame one. The left subject holds low at the water's edge with visible pressure. The right subject stays tense near the bank with locked eye-line. Clear spacing, readable tension, clean motion start. ${micro}. ${seamless}`.trim()
        : `Wide opening hold with a subtle push-in. Keep both subjects fully readable from frame one. The left subject ${s1.predatorBeat}. The right subject ${s1.preyBeat}. Clear spacing, locked eye-line, readable tension from the first second. ${micro}. ${seamless}`.trim()
  );

  const shot2PasteReady = sanitizeRunwayFPS(
    isAquatic
      ? `Wide action read with restrained tracking. Keep both subjects fully visible. The left subject commits to one fast water-pressure burst. The right subject reacts with one evasive dart. Clear pursuit line, readable spacing, no overlap. Water displacement and current response. ${micro}. ${seamless}`.trim()
      : isShoreline
        ? `Wide action read with restrained tracking. Keep both subjects fully visible. The left subject bursts once from the shoreline. The right subject reacts with one evasive leap and turn. Clear predator-to-prey line, readable spacing, no overlap. Splash and bank disturbance. ${micro}. ${seamless}`.trim()
        : `Wide action read with restrained tracking. Keep both subjects fully visible. The left subject ${s2.predatorBeat}. The right subject ${s2.preyBeat}. Clear predator-to-prey line, readable spacing, no overlap. Ground compression and clean weight transfer. ${micro}. ${seamless}`.trim()
  );

  const shot3PasteReady = sanitizeRunwayFPS(
    isAquatic
      ? `Wide aftermath hold with a slow pull-back. Keep both subjects fully readable. The left subject slows and stabilizes in the water. The right subject holds tense eye-line as residual turbulence settles. Clear spacing remains readable to the end. ${micro}. ${seamless}`.trim()
      : isShoreline
        ? `Wide aftermath hold with a slow pull-back. Keep both subjects fully readable. The left subject settles low at the waterline. The right subject holds tense eye-line as residual splash and bank disturbance fade. Clear spacing remains readable to the end. ${micro}. ${seamless}`.trim()
        : `Wide aftermath hold with a slow pull-back. Keep both subjects fully readable. The left subject ${s3.predatorBeat}. The right subject ${s3.preyBeat}. Residual atmosphere settles while spacing stays clear to the final frame. ${micro}. ${seamless}`.trim()
  ); 

  return {
        shot1: finalizePrompt(`RUNWAY SHOT 1 — OPENING TENSION [${model}]
${note}
${qLead}
${refLine}
${motionRule}
${singleRule}
${maybeGuard(s1.guardLine)}${context}

═══ PASTE-READY I2V PROMPT (copy this into Runway) ═══
${shot1PasteReady}

─── SHOT BREAKDOWN ───
Camera motion: wide opening hold with a subtle push-in.
Opening priority: both subjects fully readable from frame one, immediate visible tension, locked eye-line, clear spacing.
Subject action: left subject ${s1.predatorBeat}.
Right-side reaction: right subject ${s1.preyBeat}.
Environment motion: ${micro}.
Tone: ${tone.video}.
Framing: wide opening read, full-body visibility, clean silhouette separation.
Duration: 5–10 seconds recommended.
FPS: 24 or 25 (set in Advanced).
⚠️ No negative prompt — Runway does not support negatives.
After generation: extract LAST FRAME for Shot 2 chaining.`),

       shot2: finalizePrompt(`RUNWAY SHOT 2 — ACTION PRESSURE [${model}]
${note}
${qLead}
${refLine}
${motionRule}
${singleRule}
${maybeGuard(s2.guardLine)}${context}

═══ PASTE-READY I2V PROMPT (copy this into Runway) ═══
${shot2PasteReady}

─── SHOT BREAKDOWN ───
Camera motion: wide action read with restrained tracking.
Action priority: both subjects fully visible, clear predator-to-prey line, readable spacing, no overlap.
Subject action: left subject ${s2.predatorBeat}.
Right-side reaction: right subject ${s2.preyBeat}.
Environment motion: ${
  isAquatic
    ? `water displacement, turbulence, current response, ${micro}`
    : isShoreline
      ? `splash, mud scatter, shoreline disturbance, ${micro}`
      : `ground compression, foliage response, body-weight transfer, ${micro}`
}.
Physics: ${
  isAquatic
    ? "preserve believable water resistance, turbulence, and directional momentum."
    : isShoreline
      ? "preserve believable shoreline traction, splash interaction, mud displacement, and grounded weight transfer."
      : "preserve natural acceleration and deceleration."
}
Framing: wide action readability, full-body visibility, clean silhouette separation.
Duration: 5–10 seconds recommended.
⚠️ Upload Shot 1 last frame as I2V input.`),

    shot3: finalizePrompt(`RUNWAY SHOT 3 — RESOLVED TENSION [${model}]
${note}
${qLead}
${refLine}
${motionRule}
${singleRule}
${maybeGuard(s3.guardLine)}${context}

═══ PASTE-READY I2V PROMPT (copy this into Runway) ═══
${shot3PasteReady}

─── SHOT BREAKDOWN ───
Camera motion: wide aftermath hold with a slow pull-back.
End-state priority: both subjects fully readable, spacing still clear, tension remains visible to the final frame.
Subject action: left subject ${s3.predatorBeat}.
Right-side reaction: right subject ${s3.preyBeat}.
Environment motion: residual atmosphere — ${micro}.
Mood: ${tone.image}.
Framing: wide aftermath readability, full-body visibility, clean separation.
Duration: 5–10 seconds recommended.
⚠️ Upload Shot 2 last frame as I2V input.`), 
  };
}

// ─────────────────────────────────────────────────────────────
// KLING SHOTS — 3.0 OFFICIAL FORMAT
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
  const habitatMode = getHabitatMode(predator, prey, env);
  const isAquatic = habitatMode === "aquatic";
  const isShoreline = habitatMode === "shoreline";
  const beat1 = oneActionArcBeat(arc, "establish", gateOn, habitatMode);
  const beat2 = oneActionArcBeat(arc, "action", gateOn, habitatMode);
  const beat3 = oneActionArcBeat(arc, "aftermath", gateOn, habitatMode);

  const s1 = {
    ...beat1,
    predatorBeat: sanitizeVideoBeatText(beat1.predatorBeat),
    preyBeat: sanitizeVideoBeatText(beat1.preyBeat),
  };

  const s2 = {
    ...beat2,
    predatorBeat: sanitizeVideoBeatText(beat2.predatorBeat),
    preyBeat: sanitizeVideoBeatText(beat2.preyBeat),
  };

  const s3 = {
    ...beat3,
    predatorBeat: sanitizeVideoBeatText(beat3.predatorBeat),
    preyBeat: sanitizeVideoBeatText(beat3.preyBeat),
  };

  const mi1 = getKlingMotionIntensity(arc, "establish");
  const mi2 = getKlingMotionIntensity(arc, "action");
  const mi3 = getKlingMotionIntensity(arc, "aftermath");

  const audio1 = buildKlingAudioPrompt(predator, prey, env, weather, arc, "establish");
  const audio2 = buildKlingAudioPrompt(predator, prey, env, weather, arc, "action");
  const audio3 = buildKlingAudioPrompt(predator, prey, env, weather, arc, "aftermath");

  const characterLine = buildKlingCharacterLine(predator, prey, quality?.motionOnlyI2V);
  const locationLine = buildKlingLocationLine(env, weather, quality?.motionOnlyI2V);

  const baseExtra1 = isAquatic
    ? `${micro}. Photorealistic wildlife documentary. 9:16 vertical.`
    : isShoreline
      ? `shoreline spray, disturbed shallows, muddy bank reaction, ${micro}. Photorealistic wildlife documentary. 9:16 vertical.`
      : `${micro}. Photorealistic wildlife documentary. 9:16 vertical.`;

  const extra1 = quality?.motionOnlyI2V
    ? baseExtra1
    : `${baseExtra1} ${tone.video}. ${vibe.style}.`;

  const baseExtra3 = isAquatic
    ? `${micro}. ${tone.image}.`
    : isShoreline
      ? `residual splash rings, muddy bank settling, ${micro}. ${tone.image}.`
      : `${micro}. ${tone.image}.`;

  const extra3 = quality?.motionOnlyI2V
    ? baseExtra3
    : `${baseExtra3} ${vibe.style}.`;

  return {
        shot1: finalizePrompt(`KLING SHOT 1 — OPENING TENSION [${model}]
${note}
${qLead}
${refLine}
${motionRule}
${singleRule}
Motion intensity: ${mi1.toFixed(2)}
Opening priority: both subjects fully readable from frame one, locked eye-line, clear spacing, immediate visible tension.
${maybeGuard(s1.guardLine)}${context}

═══ KLING 3.0 PROMPT (SCALE format) ═══
Shot: WIDE opening hold or subtle push-in, full bodies visible from frame one.
${characterLine}
Action: ${formatActionSubject(predator, s1.predatorBeat)}. ${prey} ${s1.preyBeat}.
${locationLine}
Extra: ${buildKlingExtraLine(extra1, quality?.motionOnlyI2V)}

${audio1}

Kling settings: Motion intensity ${mi1.toFixed(2)} | Enable Bind Subject for identity lock | Negative prompt: use the Kling Negative Prompt card`),

 shot2: finalizePrompt(`KLING SHOT 2 — ACTION PRESSURE (WIDE${gateOn ? " + ONE-ACTION" : ""}) [${model}]
${note}
${qLead}
${refLine}
${motionRule}
${singleRule}
${wideRule}
Motion intensity: ${mi2.toFixed(2)}
Action priority: both subjects fully visible, clear predator-to-prey line, readable spacing, no overlap.
${maybeGuard(s2.guardLine)}${context}

═══ KLING 3.0 PROMPT (SCALE format) ═══
Shot: FIXED WIDE — full bodies visible, no crop, no close-ups.
${characterLine}
Action: ${formatActionSubject(predator, s2.predatorBeat)}. ${prey} ${s2.preyBeat}.
${locationLine}
Extra: ${buildKlingExtraLine(
  isAquatic
    ? `Surface response, grounded contact, ${micro}. Physics priority: coherent limbs, grounded weight, readable impact`
    : isShoreline
      ? `Splash response, muddy bank displacement, shallow-water disturbance, ${micro}. Physics priority: coherent limbs, grounded traction, readable impact`
      : `Surface response, grounded contact, ${micro}. Physics priority: coherent limbs, grounded weight, readable impact`,
  quality?.motionOnlyI2V
)}

${audio2}

Kling settings: Motion intensity ${mi2.toFixed(2)} | WIDE framing enforced | Upload Shot 1 last frame as I2V reference`),

    shot3: finalizePrompt(`KLING SHOT 3 — RESOLVED TENSION (WIDE${gateOn ? " + ONE-ACTION" : ""}) [${model}]
${note}
${qLead}
${refLine}
${motionRule}
${singleRule}
${wideRule}
Motion intensity: ${mi3.toFixed(2)}
End-state priority: both subjects fully readable, spacing still clear, tension remains visible to the final frame.
${maybeGuard(s3.guardLine)}${context}

═══ KLING 3.0 PROMPT (SCALE format) ═══
Shot: LOCKED FIXED WIDE — no movement, full bodies visible.
${characterLine}
Action: ${formatActionSubject(predator, s3.predatorBeat)}. ${prey} ${s3.preyBeat}.
${locationLine}
Extra: ${buildKlingExtraLine(extra3, quality?.motionOnlyI2V)}

${audio3}

Kling settings: Motion intensity ${mi3.toFixed(2)} | Optionally set End Frame for final pose | Upload Shot 2 last frame as I2V reference`),
  };
}

// ─────────────────────────────────────────────────────────────
// KLING NATIVE 15-SECOND MULTI-SHOT
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
const cleanEnv = sanitizeImageEnv(env);
const cleanWeather = sanitizeWeatherPhrase(weatherVariants[weather]);

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
  const habitatMode = getHabitatMode(predator, prey, env);
  const isAquatic = habitatMode === "aquatic";
  const isShoreline = habitatMode === "shoreline";
  const b1 = oneActionArcBeat(arc, "establish", gateOn, habitatMode);
  const b2 = oneActionArcBeat(arc, "action", gateOn, habitatMode);
  const b3 = oneActionArcBeat(arc, "aftermath", gateOn, habitatMode);

  const s1 = {
    ...b1,
    predatorBeat: sanitizeVideoBeatText(b1.predatorBeat),
    preyBeat: sanitizeVideoBeatText(b1.preyBeat),
  };

  const s2 = {
    ...b2,
    predatorBeat: sanitizeVideoBeatText(b2.predatorBeat),
    preyBeat: sanitizeVideoBeatText(b2.preyBeat),
  };

  const s3 = {
    ...b3,
    predatorBeat: sanitizeVideoBeatText(b3.predatorBeat),
    preyBeat: sanitizeVideoBeatText(b3.preyBeat),
  };

  const mi1 = getKlingMotionIntensity(arc, "establish");
  const mi2 = getKlingMotionIntensity(arc, "action");
  const mi3 = getKlingMotionIntensity(arc, "aftermath");

  const audio1 = buildKlingAudioPrompt(predator, prey, env, weather, arc, "establish");
  const audio2 = buildKlingAudioPrompt(predator, prey, env, weather, arc, "action");
  const audio3 = buildKlingAudioPrompt(predator, prey, env, weather, arc, "aftermath");
  const audio1Short = buildKlingAudioShort(predator, prey, env, weather, "establish");
const audio2Short = buildKlingAudioShort(predator, prey, env, weather, "action");
const audio3Short = buildKlingAudioShort(predator, prey, env, weather, "aftermath");

  const nativeSceneLine = quality?.motionOnlyI2V
  ? `Scene: same environment continuity, ${cleanWeather}.`
  : isShoreline
    ? `Scene: shoreline ambush zone, water edge, disturbed shallows, muddy bank, ${cleanWeather}.`
    : `Scene: ${cleanEnv}, ${cleanWeather}.`;

  const nativeCharacterLine = quality?.motionOnlyI2V
    ? `Characters: same ${predator} identity from input frame. Same ${prey} identity from input frame.`
    : `Characters: ${predator} (predator — drives scene pressure). ${prey} (prey — fully reactive throughout).`;

    // Paste-ready core — trimmed to stay under Kling's 2500-char textPrompt limit.
// Short audio lines used here; full audio kept in body below for reference display only.
  
// lib/prompt-builders.ts

const pasteReadyCore = [
  quality?.motionOnlyI2V
    ? `Same ${predator} and ${prey} identities from the input image in the same environment continuity, ${cleanWeather}. Photorealistic wildlife documentary in 9:16 vertical.`
    : `${predator} and ${prey} remain consistent across all three beats in ${cleanEnv}, ${cleanWeather}. Photorealistic wildlife documentary in 9:16 vertical.`,

  ``,

  `0–5s: Wide opening hold with a subtle push-in. ${formatActionSubject(predator, s1.predatorBeat)}. ${prey} ${s1.preyBeat}. Both subjects fully readable from frame one, locked eye-line, clear spacing, immediate visible tension. ${micro}.`,
  audio1Short,

  ``,

  `5–10s: Fixed wide action read. ${formatActionSubject(predator, s2.predatorBeat)}. ${prey} ${s2.preyBeat}. Both subjects fully visible, clear predator-to-prey line, readable spacing, and no overlap. ${micro}.`,
  audio2Short,

  ``,

  `10–15s: Locked wide aftermath hold. ${formatActionSubject(predator, s3.predatorBeat)}. ${prey} ${s3.preyBeat}. Both subjects stay fully readable, spacing remains clear, and tension holds to the final frame. ${micro}.`,
  audio3Short,
].join("\n").trim();

const klingValidation = validateKlingPromptLength(pasteReadyCore);
const klingLengthLine = klingValidation.isOver
  ? `PROMPT TOO LONG: ${klingValidation.length} / 2500`
  : `Prompt length OK: ${klingValidation.length} / 2500 chars`;

const body = `═══ KLING 3.0 MULTI-SHOT PROMPT (SCALE format) ═══

${nativeSceneLine}
${nativeCharacterLine}
Style: ${vibe.style}. ${tone.image}. Photorealistic wildlife documentary. 9:16 vertical frame.
Arc: ${getSafeArcPrint(arc)}.
${wideRule}

Shot 1 — OPENING TENSION (0–5 seconds) | Motion: ${mi1.toFixed(2)}:
${maybeGuard(s1.guardLine)}${predator} ${s1.predatorBeat}. ${prey} ${s1.preyBeat}.
Opening priority: both subjects fully readable from frame one, locked eye-line, clear spacing, immediate visible tension.
Camera: WIDE opening hold or subtle push-in, full bodies visible from frame one.
Environment motion: ${micro}.
${audio1}

Shot 2 — ACTION PRESSURE (5–10 seconds) — WIDE | Motion: ${mi2.toFixed(2)}:
${maybeGuard(s2.guardLine)}${predator} ${s2.predatorBeat}. ${prey} ${s2.preyBeat}.
Action priority: both subjects fully visible, clear predator-to-prey line, readable spacing, no overlap.
Camera: FIXED WIDE — full bodies visible; no crop; no close-ups.
Environment motion: ${
  isAquatic
    ? `surface response, grounded contact, ${micro}`
    : isShoreline
      ? `splash, muddy bank scatter, disturbed shallows, ${micro}`
      : `surface response, grounded contact, ${micro}`
}.
Physics priority: grounded weight transfer, coherent limb mechanics, readable impact.
${audio2}

Shot 3 — RESOLVED TENSION (10–15 seconds) — WIDE | Motion: ${mi3.toFixed(2)}:
${maybeGuard(s3.guardLine)}${predator} ${s3.predatorBeat}. ${prey} ${s3.preyBeat}.
End-state priority: both subjects fully readable, spacing still clear, tension remains visible to the final frame.
Camera: LOCKED FIXED WIDE — full bodies visible; no crop; no close-ups.
Environment motion: residual atmosphere — ${micro}.
${audio3}`;

if (!isNative) {
  return finalizePrompt(`⚠️ KLING NATIVE 15S: Requires Kling 3.0 Pro or Kling 3.0 Standard.
Selected: ${model}. Switch model to activate.`);
}

return finalizePrompt(`KLING NATIVE 15-SECOND MULTI-SHOT [${model}]
─────────────────────────────────────────────────────────
${note}
${qLead}
${refLine}
${motionRule}
${cfgLine}
Motion intensities: Shot 1 → ${mi1.toFixed(2)} | Shot 2 → ${mi2.toFixed(2)} | Shot 3 → ${mi3.toFixed(2)}${context}

═══ PASTE INTO KLING — stays under 2500 chars (copy this block only) ═══
${klingLengthLine}
${pasteReadyCore}

─── FULL BREAKDOWN — reference only, do NOT paste into Kling ───
${body}

─────────────────────────────────────────────────────────
HOW TO USE (Kling 3.0 WSTV Workflow):
1. Generate master image first (Image Prompt → NB2/Flux).
2. Upload master image as reference in Kling 3.0 Pro/Standard.
3. Enable "Bind Subject" (Elements 3.0) for identity lock.
4. Paste ONLY the block above the FULL BREAKDOWN line into Kling.
5. Set Guidance Scale: ${cfgScales.shot2} (0.0–1.0 range).
6. Enable native audio for documentary-quality sound.
7. Output: Native 4K at 60fps available.
8. Optional: Set End Frame image for final-pose control.
✅ Native single-prompt workflow — identity preserved across all 3 beats.`);
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
  const cleanEnv = sanitizeImageEnv(env);
  const cleanWeather = sanitizeWeatherPhrase(weatherVariants[weather]);
  const envLower = env.toLowerCase();
  const isArcticLike =
    envLower.includes("arctic") ||
    envLower.includes("snow") ||
    envLower.includes("tundra") ||
    envLower.includes("ice") ||
    envLower.includes("glacier") ||
    envLower.includes("frozen") ||
    envLower.includes("winter");

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
  const habitatMode = getHabitatMode(predator, prey, env);
  const aquatic = habitatMode === "aquatic";
  const shoreline = habitatMode === "shoreline";
  const b5 = oneActionArcBeat(arc, "action", gateOn, habitatMode);
  const b6 = oneActionArcBeat(arc, "aftermath", gateOn, habitatMode);

  const s5 = {
    ...b5,
    predatorBeat: sanitizeVideoBeatText(b5.predatorBeat),
    preyBeat: sanitizeVideoBeatText(b5.preyBeat),
  };

  const s6 = {
    ...b6,
    predatorBeat: sanitizeVideoBeatText(b6.predatorBeat),
    preyBeat: sanitizeVideoBeatText(b6.preyBeat),
  };

  const sixShotSceneLine = quality?.motionOnlyI2V
    ? `Scene: same environment continuity, ${cleanWeather}.`
    : shoreline
      ? `Scene: shoreline ambush zone, shallow water edge, muddy bank, ${cleanWeather}.`
      : `Scene: ${cleanEnv}, ${cleanWeather}.`;

  const sixShotCharacterLine = quality?.motionOnlyI2V
    ? `Characters: same ${predator} identity from input frame. Same ${prey} identity from input frame.`
    : `Characters: ${predator} (drives pressure). ${prey} (fully reactive).`;

  const sixShotAudio1 = aquatic
    ? "Audio: subtle underwater movement, low current wash, restrained body movement."
    : shoreline
      ? "Audio: subtle shoreline wash, restrained low body movement, wet-ground stillness."
      : isArcticLike
        ? "Audio: cold breath, faint pine wind, tight controlled inhale."
        : "Audio: heavy controlled breathing, sharp inhale.";

  const sixShotAudio2 = aquatic
    ? "Audio: water movement, tension stillness, distant current wash."
    : shoreline
      ? "Audio: shallow water movement, bank tension stillness, wet mud ambience."
      : isArcticLike
        ? "Audio: cold mountain wind through pines, winter stillness."
        : "Audio: wind through terrain, tension stillness.";

  const sixShotAudio3 = aquatic
    ? "Audio: current pressure shift, water displacement, prey alert movement."
    : shoreline
      ? "Audio: splash pressure shift, muddy bank disturbance, prey alert movement."
      : isArcticLike
        ? "Audio: snow crunch under shifting weight, tense movement, alert vocalization."
        : "Audio: weight transfer on ground surface, tense animal movement, alert vocalization.";

  const sixShotAudio4 = aquatic
    ? "Audio: alternating water movement, shifting current tension."
    : shoreline
      ? "Audio: alternating shallow splash tension, wet-ground disturbance."
      : isArcticLike
        ? "Audio: sharp alternating breath, faint frozen forest hush."
        : "Audio: rapid alternating breathing patterns.";

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

Shot 1 — OPENING TENSION (0–2s) | Motion: 0.25:
${predator} LEFT, ${prey} RIGHT, both fully visible in the same frame, immediate eye-line lock, clear spacing, visible tension from frame one.
Camera: WIDE opening hold or subtle push-in.
${sixShotAudio1}

Shot 2 — PRESSURE HOLD (2–5s) | Motion: 0.30:
${predator} maintains visible forward pressure. ${prey} stays fully alert and reactive, no overlap, spacing stays readable.
Camera: locked wide.
${sixShotAudio2}

Shot 3 — PROFILE PRESSURE (5–8s) | Motion: 0.45:
${predator} shifts weight forward with controlled commitment. ${prey} answers with one readable defensive or escape-ready adjustment.
Camera: low side-angle tracking, very slow.
${sixShotAudio3}

Shot 4 — TENSION REACTION CUT (8–11s) | Motion: 0.35:
Alternating readable reaction beats: ${predator} intensity / ${prey} survival focus. Keep tension high, keep both reactions clean and natural.
Camera: no movement.
${sixShotAudio4}

Shot 5 — ACTION PRESSURE WIDE (11–14s) — WIDE | Motion: ${getKlingMotionIntensity(arc, "action").toFixed(2)}:
${maybeGuard(s5.guardLine)}${predator} ${s5.predatorBeat}. ${prey} ${s5.preyBeat}.
Action priority: both subjects fully visible, clear predator-to-prey line, readable spacing, no overlap.
Camera: FIXED WIDE — full bodies visible; no crop; no close-ups.
Environment: ${
  aquatic
    ? `surface response + ${micro}`
    : shoreline
      ? `splash, muddy bank scatter, disturbed shallows, ${micro}`
      : `surface response + ${micro}`
}.
${buildKlingAudioPrompt(predator, prey, env, weather, arc, "action")}

Shot 6 — RESOLVED TENSION WIDE (14–15s) — WIDE | Motion: ${getKlingMotionIntensity(arc, "aftermath").toFixed(2)}:
${maybeGuard(s6.guardLine)}${predator} ${s6.predatorBeat}. ${prey} ${s6.preyBeat}.
End-state priority: both subjects fully readable, spacing still clear, tension remains visible to the final frame.
Camera: LOCKED FIXED WIDE — full bodies visible; no crop; no close-ups.
${buildKlingAudioPrompt(predator, prey, env, weather, arc, "aftermath")}

──────────────────────────────────────────────────────
HOW TO USE (Kling 3.0 WSTV 6-Shot Workflow):
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

// ─────────────────────────────────────────────────────────────
// CAPCUT PLAN
// ─────────────────────────────────────────────────────────────
export function buildCapCutPlan(predator: string, arc: string, weather: Weather): string {
  const safeArc = getSafeArcPrint(arc);
  return finalizePrompt(
    `CAPCUT PLAN — ${predator} | Arc: ${safeArc} | Weather: ${weather}
1. Start on the strongest readable opening frame.
2. Keep both subjects visible as early as possible.
3. Prioritize immediate predator pressure and survival-animal reaction.
4. Avoid slow setup, empty opening space, or unclear subject visibility.
5. End on a clean high-tension or resolved-tension frame.`
  );
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

  return finalizePrompt(`CLIP CHAINING — ${predator.toUpperCase()}
${riskLine}

═══ RUNWAY GEN-4.5 CHAINING (Official Method) ═══
STEP 1 — Generate Shot 1 (Runway I2V) with strong first-frame readability and both subjects clearly readable.
  • Move playback scrubber to the very end of the completed video.
  • Extract the LAST FRAME and use it as the next input.
STEP 2 — Chain Shot 2: upload Shot 1 last frame as I2V input. Prompt = motion only.
STEP 3 — Chain Shot 3: upload Shot 2 last frame. Keep end-state tension readable and spacing clear.
STEP 4 — Combine clips in a video editor. Remove the shared frame.

═══ KLING 3.0 CHAINING ═══
STEP 1 — Generate Shot 1 with clear opening tension and readable full-subject visibility.
STEP 2 — Upload the previous last frame as I2V input + enable Bind Subject.
STEP 3 — Optionally set End Frame for precise final-pose control.
STEP 4 — Alternative: use Multi-Shot mode (up to 6 shots, single prompt).

RULE: Subject description stays consistent across all clips.
RULE: Preserve predator-to-survival-animal spacing and readable silhouette separation.
RULE (Runway): Do NOT include appearance text in I2V prompts.
RULE (Kling): Use Bind Subject (Elements 3.0) for identity lock.`);
}

// ─────────────────────────────────────────────────────────────
// ENGINE CONSTRAINT VALIDATOR
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
        message:
          "Kling 3.0 supports negative prompts. Use them to reduce drift, anatomy artifacts, overlap, and weak subject readability.",
      });
    }
  }

  return warnings;
}
