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
// lib/model-specs.ts

// ... (imports and other constants unchanged)

export const RUNWAY_STYLE_NOTE: Record<RunwayModel, string> = {
  "Gen-4.5":
    // Emphasize the opening seconds and U.S. audience familiarity.  
    "Runway Gen-4.5: flagship — best cinematic quality, temporal coherence and camera control. The first 1–3 seconds are critical: prioritize strong first‑frame readability, immediate visible tension and clear predator‑to‑survival‑animal spacing. Choose U.S.‑familiar wildlife and habitats when possible for higher Facebook Reels engagement. Use rich camera language: push, drift, hold and track.",

  "Gen-4 Turbo":
    // Fast model guidance with new opening‑readability focus.  
    "Runway Gen-4 Turbo: fast cinematic model — focus on readable openings, clear subject spacing and simple camera motion. Make the opening second compelling with visible predator pressure and full subject visibility. Use natural camera language: push, drift and hold.",

  "Gen-4":
    // Legacy model note updated to highlight tension from frame one.  
    "Runway Gen-4: stable model — describe camera angles explicitly and keep the opening clear, readable and tension‑forward. Ensure that both animals are visible and the threat line is obvious from the first second.",
};

export const KLING_STYLE_NOTE: Record<KlingModel, string> = {
  "Kling 3.0 Pro":
    // Updated note: highlight first‑seconds tension, full‑body clarity and U.S. familiarity.  
    "Kling 3.0 Pro: WSTV action workflow — the first 1–3 seconds should deliver immediate visible tension and full‑body clarity. Prioritize strong opening readability, clear subject spacing, realistic body mechanics, weight transfer, impact forces and environmental reaction in full detail. Where possible, choose U.S.‑familiar wildlife and habitats to boost Facebook Reels performance.",

  "Kling 3.0 Standard":
    // Emphasize first‑frame clarity and immediate predator pressure.  
    "Kling 3.0 Standard: balanced WSTV motion workflow — prioritize readable openings with both animals visible, clear subject spacing, one primary action and grounded weight. Ensure the threat is obvious from frame one and environments reflect recognizable U.S. habitats for better audience connection.",

  "Kling 2.6 Pro":
    // Older model with updated guidance for opening tension.  
    "Kling 2.6 Pro: strong physics and character motion. Keep prompts clear, readable and action‑focused with strong subject visibility. Make the opening frames count by establishing tension instantly and using realistic U.S. wildlife setups.",

  "Kling 2.5 Turbo Pro":
    // Speedy model — still respect opening readability.  
    "Kling 2.5 Turbo Pro: fast — single primary motion per shot, readable opening composition and clean subject spacing. Start/End Frame supported. Even in rapid tests, ensure the opening frames are clear, tense and recognizable to U.S. viewers.",

  "Kling 2.5 Turbo":
    // Quick draft option — emphasise strong openings.  
    "Kling 2.5 Turbo: fast I2V — keep prompts short, readable and focused on one clean motion beat. Use it for quick structure checks but still begin with fully visible subjects and immediate tension to simulate final quality.",
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
    official: "Action-focused Kling workflow option used in WSTV.",
    house:    "🆕 Best for readable action openings, 15s multi-shot, and strongest body-mechanics control.",
  },
  "Kling 3.0 Standard": {
    official: "Balanced Kling workflow option used in WSTV.",
    house:    "🆕 Good balance of quality, speed, and clear full-subject readability for daily WSTV output.",
  },
  "Kling 2.6 Pro": {
    official: "Earlier Kling workflow option kept for compatibility.",
    house:    "Solid fallback when 3.0 queue is long, but keep prompts simple and readable.",
  },
  "Kling 2.5 Turbo Pro": {
    official: "Fast Kling workflow option for lighter motion tests.",
    house:    "Quick motion-structure tests only. Keep one clear action beat and clean spacing.",
  },
  "Kling 2.5 Turbo": {
    official: "Fast draft Kling workflow option.",
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
