// ─────────────────────────────────────────────────────────────
// lib/model-specs.ts
// WSTV — Model Specs, Arc Data & Constants
//
// LABEL SYSTEM (for future maintainability):
//   [Official]       = confirmed by official docs
//   [House]          = creator-practice recommendation
//   [House estimate] = varies by queue/region — not a hard spec
//
// HOW TO UPDATE WHEN MODELS CHANGE:
//   Only touch the .official string.
//   Never merge official phrasing into .house — keep them separate.
// ─────────────────────────────────────────────────────────────

import type { RunwayModel, KlingModel, Arc, Engine, DepthMode, Weather, HabitatPreset } from "@/types";

// ─────────────────────────────────────────────────────────────
// BRAND
// ─────────────────────────────────────────────────────────────
export const BRAND_NAME      = "WILD STORIES TV";
export const WORKFLOW_PREFIX = "WSTV";
// Reference tags (standardized for Runway/Kling workflows)
export const REF_TAGS = {
  heroPredator: "@hero_predator",
  heroPrey: "@hero_prey",
  envPlate: "@env_plate",
} as const;

// ─────────────────────────────────────────────────────────────
// MODEL LISTS
// ─────────────────────────────────────────────────────────────
export const RUNWAY_MODELS: RunwayModel[] = [
  "Gen-4.5",
  "Gen-4 Turbo",
  "Gen-4",
];

export const KLING_MODELS: KlingModel[] = [
  "Kling 3.0 Pro",
  "Kling 3.0 Standard",
  "Kling 2.6 Pro",
  "Kling 2.5 Turbo Pro",
  "Kling 2.5 Turbo",
];

// ─────────────────────────────────────────────────────────────
// CREDIT MULTIPLIERS
// [House estimate] — relative weight for UI display only.
// Real credit costs vary — check official billing pages.
// ─────────────────────────────────────────────────────────────
export const RUNWAY_MODEL_MULT: Record<RunwayModel, number> = {
  "Gen-4.5":     1.05,
  "Gen-4 Turbo": 1.00,
  "Gen-4":       0.95,
};

export const KLING_MODEL_MULT: Record<KlingModel, number> = {
  "Kling 3.0 Pro":       1.05,
  "Kling 3.0 Standard":  1.00,
  "Kling 2.6 Pro":       0.95,
  "Kling 2.5 Turbo Pro": 0.92,
  "Kling 2.5 Turbo":     0.88,
};

// ─────────────────────────────────────────────────────────────
// PROMPT STYLE NOTES
// Injected at the top of each generated prompt to remind the
// user which model is active and how to prompt it.
// ─────────────────────────────────────────────────────────────
export const RUNWAY_STYLE_NOTE: Record<RunwayModel, string> = {
  "Gen-4.5":
    // [Official] flagship — strong motion quality, prompt adherence, visual fidelity
    // [House] camera-first prompting: push, drift, hold, track
    "Runway Gen-4.5: flagship — best cinematic quality, temporal coherence, camera control. Use rich camera language: push, drift, hold, track.",

  "Gen-4 Turbo":
    // [Official] faster generation, lower cost
    // [House] iterate motion structure here, upgrade to Gen-4.5 for finals
    "Runway Gen-4 Turbo: fast cinematic model — prioritise camera motion. Use natural camera language: push, drift, hold.",

  "Gen-4":
    // [Official] stable model
    "Runway Gen-4: stable model — describe camera angles explicitly.",
};

export const KLING_STYLE_NOTE: Record<KlingModel, string> = {
  "Kling 3.0 Pro":
    // [Official] native audio, Start/End Frame, motion control
    // [House] best for action sequences and body mechanics
  "Kling 3.0 Pro: WSTV action workflow — describe body mechanics, weight, impact forces, and environmental reaction in full detail.",

  "Kling 3.0 Standard":
    // [Official] native audio, Start/End Frame
    "Kling 3.0 Standard: balanced WSTV motion workflow — describe primary action, weight, and environmental reaction.",

  "Kling 2.6 Pro":
    // [Official] Image/Text to Video + audio
    "Kling 2.6 Pro: strong physics + character motion. Image/Text to Video with audio.",

  "Kling 2.5 Turbo Pro":
    // [Official] Start/End Frame supported
    "Kling 2.5 Turbo Pro: fast — single primary motion per shot. Start/End Frame supported.",

  "Kling 2.5 Turbo":
    // [Official] fast I2V
    "Kling 2.5 Turbo: fast I2V — keep prompts short and focused.",
};

// ─────────────────────────────────────────────────────────────
// MODEL NOTES  (shown in UI dropdown selectors)
//
// Two fields kept separate so official doc updates only touch
// .official — .house recommendations stay stable.
// ─────────────────────────────────────────────────────────────
export type ModelNote = {
  official: string; // confirmed by official docs:
  house:    string; // creator-practice recommendation
};

export const RUNWAY_MODEL_NOTES: Record<RunwayModel, ModelNote> = {
  "Gen-4.5": {
    official: "Flagship. Strong motion quality, prompt adherence, visual fidelity.",   // [Official]
    house:    "🆕 Best choice for hero shots and final-quality renders.",
  },
  "Gen-4 Turbo": {
    official: "Faster generation, lower credit cost.",                                 // [Official]
    house:    "⚡ Iterate motion structure here — upgrade to Gen-4.5 for finals.",
  },
  "Gen-4": {
    official: "Stable generation model.",                                              // [Official]
    house:    "Reliable for standard cinematic shots.",
  },
};

export const KLING_MODEL_NOTES: Record<KlingModel, ModelNote> = {
  "Kling 3.0 Pro": {
    official: "Action-focused Kling workflow option used in WSTV.",
    house:    "🆕 Best for action sequences, 15s multi-shot, motion transfer.",
  },
  "Kling 3.0 Standard": {
    official: "Balanced Kling workflow option used in WSTV.",
    house:    "🆕 Good balance of quality and speed for daily WSTV schedule.",
  },
  "Kling 2.6 Pro": {
    official: "Earlier Kling workflow option kept for compatibility.",
    house:    "Solid fallback if 3.0 queue is long.",
  },
  "Kling 2.5 Turbo Pro": {
    official: "Fast Kling workflow option for lighter motion tests.",
    house:    "Quick motion structure tests only.",
  },
  "Kling 2.5 Turbo": {
    official: "Fast draft Kling workflow option.",
    house:    "Cheapest option — low-stakes drafts only.",
  },
};

// ─────────────────────────────────────────────────────────────
// TIMELINE FPS GUIDANCE
//
// [Official — Runway Help Center]:
//   Runway Gen-4.5 outputs at 24fps / 25fps native.
//   Do NOT write 30fps in Runway/Veo/Sora prompts.
//   30fps = platform export step only (Facebook/TikTok upload).
// ─────────────────────────────────────────────────────────────
export const TIMELINE_BASE_FPS: Record<Engine | "VEO" | "SORA", string> = {
  RUNWAY: "24fps native — set CapCut project to 24fps to match source",
  KLING:  "Use 24fps for cinematic editing; higher frame-rate social exports can be used for action clips",
  VEO:    "24fps cinematic native — match 24fps in editor",
  SORA:   "24fps standard — export to 30fps at final platform upload step only",
};

// ─────────────────────────────────────────────────────────────
// STORY ARCS
// ─────────────────────────────────────────────────────────────
// Arc type is defined in @/types — this array must match that union exactly.
export const arcs: readonly Arc[] = [
  "Ambush attack",
  "Predator vs predator fight",
  "Chase and takedown",
  "Escape from danger",
  "Territory dominance battle",
  "Pack hunting strategy",
  "Defender stands ground",
  "Giant vs giant clash",
];

// ─────────────────────────────────────────────────────────────
// OPTION ARRAYS  (used by UI selectors)
// ─────────────────────────────────────────────────────────────
export const depthModes: DepthMode[] = [
  "Cinematic Blur",
  "Balanced Depth",
  "Detailed Background",
];

export const weatherOptions: Weather[] = [
  "Golden Hour",
  "Storm",
  "Overcast",
  "Dawn",
  "Midday Heat",
  "Winter Blizzard",
  "Frozen Dusk",
];
export const habitatOptions: HabitatPreset[] = [
  "Auto",
  "Rocky Mountain Meadow",
  "Forest Clearing",
  "Open Green Grassland",
  "Riverbank Reeds",
  "Marsh Wetland",
  "Desert Scrubland",
  "Snow Field Tundra",
  "Coastal Cliffline",
  "Dry Savanna Plain",
  "Dense Jungle Edge",
];
// ─────────────────────────────────────────────────────────────
// ARC MOTION STRENGTH  (Runway legacy 0–100 scale)
// [House] — relative intensity per arc for Motion Strength slider.
// Not an official spec. Adjust freely based on results.
// ─────────────────────────────────────────────────────────────
export const arcMotionStrength: Record<Arc, number> = {
  "Ambush attack":              72,
  "Chase and takedown":         80,
  "Pack hunting strategy":      68,
  "Territory dominance battle": 75,
  "Escape from danger":         85,
  "Predator vs predator fight": 78,
  "Defender stands ground":     83,
  "Giant vs giant clash":       88,
};

// ─────────────────────────────────────────────────────────────
// ARC CFG SCALE  (WSTV Kling workflow — 0.0–1.0 guidance range)
//
// [WSTV workflow note]:
//   CFG-style control treated in WSTV as a 0.0–1.0 guidance range.
//   Reconfirm exact public wording from primary Kling docs when available.
//
// [House] Wildlife sweet spot: 0.4–0.65
//   Per-shot offsets:
//     Shot 1 = base − 0.10  (gentler establishing shot)
//     Shot 2 = base         (peak action beat)
//     Shot 3 = base − 0.15  (minimal aftermath)
// ─────────────────────────────────────────────────────────────
export const arcCfgScale: Record<Arc, number> = {
  "Ambush attack":              0.55,
  "Chase and takedown":         0.60,
  "Pack hunting strategy":      0.50,
  "Territory dominance battle": 0.55,
  "Escape from danger":         0.65,
  "Predator vs predator fight": 0.58,
  "Defender stands ground":     0.60,
  "Giant vs giant clash":       0.65,
};

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

/** Convert legacy 0–100 Runway motionStrength to Kling CFG Scale (0.0–1.0) */
export function toCfgScale(ms: number): number {
  return Math.round((ms / 100) * 10) / 10;
}

/** Get per-shot CFG scale values for Kling native multi-shot prompts */
export function getKlingCfgScales(arc: Arc): {
  shot1: number;
  shot2: number;
  shot3: number;
} {
  const base = arcCfgScale[arc] ?? 0.55;
  return {
    shot1: Math.max(0.35, Math.round((base - 0.10) * 10) / 10),
    shot2: base,
    shot3: Math.max(0.30, Math.round((base - 0.15) * 10) / 10),
  };
}

/**
 * Scale a base millisecond duration by model multiplier.
 * Used for UI progress bar animations only — [House estimate].
 */
export function scaledMs(base: number, model: string, engine: Engine): number {
  const mult =
    engine === "RUNWAY"
      ? RUNWAY_MODEL_MULT[model as RunwayModel]
      : KLING_MODEL_MULT[model as KlingModel];
  return Math.round(base * (mult ?? 1));
}

/** Format a ModelNote for compact single-line UI display */
export function formatModelNote(note: ModelNote): string {
  return `${note.house}  ·  ${note.official}`;
}
