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
// Injected at the top of each generated prompt as WSTV house guidance.
// These are not vendor-confirmed spec strings.
// ─────────────────────────────────────────────────────────────
// lib/model-specs.ts

// ... (imports and other constants unchanged)

export const RUNWAY_STYLE_NOTE: Record<RunwayModel, string> = {
  "Gen-4.5":
    "Runway Gen-4.5: flagship — best cinematic quality, temporal coherence and camera control. The first 1–3 seconds are critical: prioritize strong first‑frame readability, immediate visible tension, and clear predator‑to‑survival‑animal spacing. Choose strong U.S. wildlife framing when that fits the audience focus. Use rich camera language: push, drift, hold, and track.",

  "Gen-4 Turbo":
    // Fast model guidance with new opening‑readability focus.  
    "Runway Gen-4 Turbo: fast cinematic model — focus on readable openings, clear subject spacing and simple camera motion. Make the opening second compelling with visible predator pressure and full subject visibility. Use natural camera language: push, drift and hold.",

  "Gen-4":
    // Legacy model note updated to highlight tension from frame one.  
    "Runway Gen-4: stable model — describe camera angles explicitly and keep the opening clear, readable and tension‑forward. Ensure that both animals are visible and the threat line is obvious from the first second.",
};

export const KLING_STYLE_NOTE: Record<KlingModel, string> = {
  "Kling 3.0 Pro":
    "Kling 3.0 Pro: WSTV action workflow — write like a director giving scene instructions, not a keyword list. Describe camera, subject motion, and scene intent as one flowing direction. The first 1–3 seconds should deliver immediate full-body readability, visible tension, and clear predator-to-survival-animal spacing.",
  "Kling 3.0 Standard":
    "Kling 3.0 Standard: balanced WSTV motion workflow — director-style prompt, not form fields. Both animals must be clearly readable from frame one with unambiguous subject spacing. One primary action per shot. Environments should reflect recognizable U.S. habitats.",
  "Kling 2.6 Pro":
    "Kling 2.6 Pro: strong physics and character motion. Write as a single clear directing sentence: who is present, what happens, how it is filmed. Make the opening frames establish tension instantly with clear subject readability.",
  "Kling 2.5 Turbo Pro":
    "Kling 2.5 Turbo Pro: fast — one directing sentence, single primary motion, readable opening composition, clean subject spacing. Start/End Frame supported. Opening frames must be clear and tense.",
  "Kling 2.5 Turbo":
    "Kling 2.5 Turbo: fast I2V draft — one short directing sentence per shot. Quick structure tests only. Still start with fully visible subjects and immediate tension.",
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
    official: "Flagship. Strong motion quality, prompt adherence, visual fidelity.",
    house:    "🆕 Best choice for hero shots, strong first-frame readability, and final-quality renders.",
  },
  "Gen-4 Turbo": {
    official: "Faster generation, lower credit cost.",
    house:    "⚡ Best for fast structure tests with clear openings before upgrading to Gen-4.5.",
  },
  "Gen-4": {
    official: "Stable generation model.",
    house:    "Reliable for standard cinematic shots with simple readable opening composition.",
  },
};

export const KLING_MODEL_NOTES: Record<KlingModel, ModelNote> = {
  "Kling 3.0 Pro": {
    official: "Current Kling 3.0 Pro model option.",
    house:    "🆕 Best for readable action openings, 10s multi-shot tests, and strongest body-mechanics control.",
  },
  "Kling 3.0 Standard": {
    official: "Current Kling 3.0 Standard model option.",
    house:    "🆕 Good balance of quality, speed, and clear full-subject readability for daily WSTV output.",
  },
  "Kling 2.6 Pro": {
    official: "Earlier Kling model option retained for compatibility.",
    house:    "Solid fallback when 3.0 queue is long, but keep prompts simple and readable.",
  },
  "Kling 2.5 Turbo Pro": {
    official: "Turbo-oriented Kling model option for faster generations.",
    house:    "Quick motion-structure tests only. Keep one clear action beat and clean spacing.",
  },
  "Kling 2.5 Turbo": {
    official: "Fast draft-oriented Kling model option.",
    house:    "Cheapest option for low-stakes drafts and rough opening tests only.",
  },
};

// ─────────────────────────────────────────────────────────────
// TIMELINE FPS GUIDANCE
//
// [Official — Runway Help Center]:
//   Runway Gen-4.5 outputs at 24fps / 25fps native.
//   Do NOT write 30fps in Runway/Veo/Sora prompts.
//   30fps = platform export step only (Facebook/TikTok upload).
// [House]:
//   Kling/Veo/Sora lines below are editor workflow recommendations, not provider-locked export rules.
// ─────────────────────────────────────────────────────────────
export const TIMELINE_BASE_FPS: Record<Engine | "VEO" | "SORA", string> = {
  RUNWAY: "24fps native — keep edits at 24fps for clean motion continuity and readable wildlife movement",
  KLING:  "Use 24fps for cinematic wildlife edits; export higher only at final social delivery if needed",
  VEO:    "24fps cinematic native — match 24fps in editor for stable motion continuity",
  SORA:   "24fps standard — keep edit timeline clean, export to 30fps only at final platform upload step if required",
};

// ─────────────────────────────────────────────────────────────
// STORY ARCS
// ─────────────────────────────────────────────────────────────
// Arc type is defined in @/types — this array must match that union exactly.
export const arcs: readonly Arc[] = [
  "Pack hunting strategy",
  "Defender stands ground",
  "Ambush attack",
  "Escape from danger",
  "Territory dominance battle",
  "Predator vs predator fight",
  "Chase and takedown",
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
  "Open Prairie Grassland",
  "Forest Clearing",
  "Riverbank Reeds",
  "Cypress Swamp Edge",
  "Everglades Marsh",
  "Snow Field Tundra",
  "Dry Prairie Plain",
  "Desert Scrubland",
  "Coastal Cliffline",
];
// ─────────────────────────────────────────────────────────────
// ARC MOTION STRENGTH  (Runway legacy 0–100 scale)
// [House] — relative intensity per arc for Motion Strength slider.
// Not an official spec. Adjust freely based on results.
// ─────────────────────────────────────────────────────────────
export const arcMotionStrength: Record<Arc, number> = {
  "Pack hunting strategy":      62,
  "Defender stands ground":     58,
  "Ambush attack":              66,
  "Escape from danger":         74,
  "Territory dominance battle": 60,
  "Predator vs predator fight": 64,
  "Chase and takedown":         70,
  "Giant vs giant clash":       68,
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
  "Pack hunting strategy":      0.46,
  "Defender stands ground":     0.48,
  "Ambush attack":              0.50,
  "Escape from danger":         0.60,
  "Territory dominance battle": 0.50,
  "Predator vs predator fight": 0.52,
  "Chase and takedown":         0.56,
  "Giant vs giant clash":       0.56,
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
