// lib/workflow-packs.ts
// WSTV — Workflow Packs, CapCut Scripts, Sound Design,
//         Motion Prompts, Camera Plans, Two-Part Presets
//
// RULES:
//   • Pure functions only — no React, no useState, no UI
//   • All functions exported for use in buildPackage()
//
// FPS NOTE:
//   Runway Gen-4.5 outputs 24fps/25fps native.
//   CapCut project base = 24fps.
//   30fps = platform export step only.

import type {
  Arc,
  Weather,
  RunwayModel,
  GeneratedPackage,
  CapCutScript,
  CapCutBeat,
  SoundDesignPack,
  AnimalBehavior,
  TwoPartViralPreset,
} from "@/types";

import {
  BRAND_NAME,
  WORKFLOW_PREFIX,
} from "@/lib/model-specs";

// ─────────────────────────────────────────────────────────────
// WORKFLOW SANITIZERS
// ─────────────────────────────────────────────────────────────
function sanitizeWorkflowEnv(env: string): string {
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

function sanitizeWorkflowPhrase(text: string): string {
  return String(text ?? "")
    .split("\n")
    .map((line) =>
      line
        .replace(/\bbreath vapor sub-bass 30Hz\b/gi, "low wind sub-bass 30Hz")
        .replace(/\bbreath vapor sound\b/gi, "cold-air movement")
        .replace(/\bfrozen breath whoosh\b/gi, "cold-air rush")
        .replace(/\bbreath clouds collision\b/gi, "surface-contact collision")
        .replace(/\bbreath comes in visible rapid clouds\b/gi, "breathing becomes fast and controlled")
        .replace(/\bbreath clouds rapid and thick in cold air\b/gi, "controlled breathing in cold air")
        .replace(/\bbreath clouds rapid\b/gi, "fast controlled breathing")
        .replace(/\bcold breath visible\b/gi, "clean cold-air clarity")
        .replace(/\bbreath vapor visible\b/gi, "clean cold-air clarity")
        .replace(/\bsteam breath visible\b/gi, "clean cold-air clarity")
        .replace(/\bvisible breath vapor\b/gi, "clean cold-air clarity")
        .replace(/\bvisible breath plumes\b/gi, "clean cold-air clarity")
        .replace(/\bdistant geothermal hiss\b/gi, "distant wind through open terrain")
        .replace(/\bpowder displacement on contact\b/gi, "stable surface response on contact")
        .replace(/\bsnow drifting across layered depth\b/gi, "layered cold-environment depth")
        .replace(/\blight snow drifting across frame\b/gi, "restrained cold-environment motion across frame")
        .replace(/\bsnow particles drifting diagonally through layered depth\b/gi, "layered cold-environment depth")
        .replace(/\bbreath remain readable\b/gi, "micro-motion remains readable")
        .replace(/\bBreath vapor: intensity 1-2\/5\.?\b/gi, "")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\s+,/g, ",")
        .replace(/\s+\./g, ".")
        .trimEnd()
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getWorkflowAtmosphere(env: string, weather: Weather): string {
  const cleanEnv = sanitizeWorkflowEnv(env);
  const winter = weather === "Winter Blizzard" || weather === "Frozen Dusk";

  if (winter) {
    return "clean cold-air clarity, layered cold-environment depth, stable surface response on contact";
  }

  if (/river|water|lake|swamp|ocean|coast|estuary/i.test(cleanEnv)) {
    return "water ripples, spray, surface turbulence, wet impact response";
  }

  return "dust or grass movement, light debris scatter, subtle atmospheric drift";
}

// ─────────────────────────────────────────────────────────────
// EXTRA TYPES FOR UI PIPELINE MODE
// ─────────────────────────────────────────────────────────────
export type PipelineShot = {
  id: number;
  title: string;
  engine: "RUNWAY" | "KLING";
  durationLabel: string;
  description: string;
  copyText: string;
};

export type WorkflowPipelinePack = {
  id: "3shot" | "4shot" | "5shot";
  name: string;
  badge: string;
  totalDuration: string;
  summary: string;
  shots: PipelineShot[];
};

export type ShotMode = "3shot" | "4shot" | "5shot";

// ─────────────────────────────────────────────────────────────
// 1. ANIMAL BEHAVIOR LIBRARY
// ─────────────────────────────────────────────────────────────
const animalBehaviorLibrary: Record<string, AnimalBehavior> = {
  Tiger: {
    preAttackSignals: [
      "Tail held low and still — ready to spring",
      "Pupils dilate fully 0.3s before charge",
      "Weight shifts to rear haunches",
      "Ears rotate forward to lock sound direction",
    ],
    naturalMotion: [
      "Moves in direct straight line — never curves before strike",
      "Head stays perfectly level while body crouches lower",
      "Paws placed silently — heel-toe walking pattern",
      "Can cover 10m in under 1 second from standing",
    ],
    soundDesign: [
      "Deep chest rumble 30-80Hz — felt more than heard",
      "Explosive exhale chuff at strike moment",
      "Prey reaction: sharp panic vocalization",
      "Dense jungle: branch snap, leaf scatter, wet ground impact",
    ],
    bodyLanguage: [
      "Whiskers forward = locked on target",
      "Pupils fully dilated = committed to attack",
      "Spine parallel to ground = maximum stealth mode",
    ],
    habitatFacts: [
      "Hunts primarily at dusk and dawn",
      "Ambush range: 6-20 metres",
      "Stalks for 20-40 minutes before committing",
    ],
    promptInjection:
      "Tiger moves with spine parallel to ground, head level, tail held low and motionless. Weight shifts to rear haunches 0.3s before launch. Pupils fully dilated, whiskers pressed forward, ears locked forward.",
  },

  Lion: {
    preAttackSignals: [
      "Mane flattens against neck during charge",
      "Ears fold back completely — aerodynamic for speed",
      "Eyes lock — blink rate drops to zero",
      "Group members fan out — coordinated surround pattern",
    ],
    naturalMotion: [
      "Female leads — male drives prey toward ambush",
      "Can reach 80km/h for 100m maximum sprint",
      "Uses dust/wind direction — always approaches downwind",
      "Coordinate with head tilts — silent group signals",
    ],
    soundDesign: [
      "Pre-attack: complete silence — no vocalization",
      "Impact: prey distress call + dust/grass impact",
      "Post-hunt: deep satisfied rumble from the group",
      "Savanna: dry grass crush, dust plume, distant birds scatter",
    ],
    bodyLanguage: [
      "Tail tip twitch = final countdown",
      "Crouched silhouette = camouflage mode",
      "Eye contact broken = distraction behavior pre-attack",
    ],
    habitatFacts: [
      "Groups hunt cooperatively with role assignment",
      "Hunt success rate: 25-30% solo, 50%+ cooperative",
      "Golden hour hunting preferred — heat shimmer provides cover",
    ],
    promptInjection:
      "Lion mane pressed flat against neck, ears folded aerodynamically back, eyes unblinking and locked. Tail tip twitching at exact 1-second intervals. Dust settling around crouched silhouette in golden backlight.",
  },

  Wolf: {
    preAttackSignals: [
      "Pack fans into crescent formation — no signal needed",
      "Lead wolf drops pace to walking — triggers others",
      "Each wolf locks onto specific target — no switching",
      "Hackles fully raised on all pack members simultaneously",
    ],
    naturalMotion: [
      "Endurance hunters — chase at 50km/h for 20+ minutes",
      "Alpha always trails behind to conserve energy for final sprint",
      "Never attack head-on — always flank and exhaust",
      "Communicate through body position at distance",
    ],
    soundDesign: [
      "Pre-hunt: complete pack silence — no howling",
      "During: only breathing and paw impact on snow",
      "Impact: pack coordinated vocalization at takedown",
      "Forest: snow crunch, branch crack, prey panic breathing",
    ],
    bodyLanguage: [
      "Ears forward = tracking mode",
      "Tail horizontal = chase mode activated",
      "Low body carriage = stealth approach through snow",
    ],
    habitatFacts: [
      "Hunt in -30°C without reducing efficiency",
      "Pack coordination requires no verbal communication",
      "Prefer weak or separated prey — strategic patience",
    ],
    promptInjection:
      "Wolf pack in disciplined crescent formation, hackles fully raised, each wolf's gaze locked independently on the target. Lead wolf drops to near-walking pace, body low. Total silence — only clean cold-air clarity around the muzzle.",
  },

  Cheetah: {
    preAttackSignals: [
      "Eyes lock on single target — ignores all else",
      "Body drops 15cm as haunches coil",
      "Tear marks become more visible as face tightens",
      "Breathing deepens — chest expands twice normal size",
    ],
    naturalMotion: [
      "0-112km/h in 3 seconds — fastest land animal",
      "Spine flexes 180 degrees extending stride to 7 metres",
      "Claws never fully retract — act as track spikes",
      "Mid-air turns using tail as rudder — pure aerodynamics",
    ],
    soundDesign: [
      "Launch: single sharp exhalation — like a compressed air burst",
      "At speed: paw impacts machine-gun rapid on hard ground",
      "Prey contact: high-pitched prey distress + dust explosion",
      "Open savanna: grass flatten wave, heat shimmer",
    ],
    bodyLanguage: [
      "Still as stone = final targeting lock",
      "Tear marks visible = face muscles tensed fully",
      "Tail raised slightly = balance preparation for sprint",
    ],
    habitatFacts: [
      "Hunt only in daylight — depends on vision not smell",
      "Chase lasts maximum 60 seconds — overheats beyond that",
      "Success rate: 40-50% — highest of all big cats",
    ],
    promptInjection:
      "Cheetah body dropped 15cm, haunches coiled, spine horizontal. Tear marks stark against tensed facial muscles. Chest visibly expanded, one massive breath held. Tail slightly raised for balance — milliseconds from launch.",
  },

  Bison: {
    preAttackSignals: [
      "Head lowered to exact parallel with ground",
      "Hooves paw twice — then stillness before charge",
      "Breathing becomes fast and controlled",
      "Eyes roll showing white — threat assessment complete",
    ],
    naturalMotion: [
      "Can pivot full 180 degrees at 55km/h",
      "Shoulder hump acts as shock absorber",
      "Charge at 55km/h — unstoppable beyond 5 metre gap",
      "Head swings laterally on impact — maximum force transfer",
    ],
    soundDesign: [
      "Pre-charge: deep nasal exhalation — single enormous breath out",
      "Ground vibration: audible from 50 metres away",
      "Impact: bone-deep bass thud — felt through ground",
      "Yellowstone: dry grass crack, distant wind through open terrain, ravens scatter",
    ],
    bodyLanguage: [
      "Head perfectly parallel = committed to charge",
      "Pawing ground = final warning issued",
      "Fast controlled breathing = adrenaline response active",
    ],
    habitatFacts: [
      "Can survive -40°C Yellowstone winters",
      "Males weigh up to 900kg — pure momentum weapon",
      "Charge leaves competitor airborne for 2-4 metres",
    ],
    promptInjection:
      "Bison massive head lowered precisely parallel to ground, both hooves having completed the pawing ritual. Controlled breathing in cold air. Shoulder hump tense, eyes showing white of threat assessment. Ground compressing under each step.",
  },

  Crocodile: {
    preAttackSignals: [
      "Eyes sink to waterline — only pupils visible",
      "Body rises 2cm in water = pre-launch position",
      "Jaw slightly open = thermoregulation OR ambush ready",
      "Zero ripples — stillness is the weapon",
    ],
    naturalMotion: [
      "Tail drives explosive 3D launch — body leaves water completely",
      "Rolls prey immediately — death roll to disorient",
      "Back to water within 4 seconds of strike",
      "Can hold breath 2 hours — patience is the strategy",
    ],
    soundDesign: [
      "Pre-strike: absolute river silence — birds stop calling",
      "Launch: explosive water displacement — wall of spray",
      "Impact: jaw lock sound — deep bone resonance",
      "River: turbulent water, prey panic, spray settling",
    ],
    bodyLanguage: [
      "Below waterline eyes = patient ambush mode",
      "Stillness duration = confidence level rising",
      "Jaw crack = territory signal, not attack signal",
    ],
    habitatFacts: [
      "Can detect single water drop at 10 metres distance",
      "Waits at same crossing point for weeks",
      "Strike force: 2,500 psi — among strongest bites on Earth",
    ],
    promptInjection:
      "Crocodile submerged to eye-line only, ancient rough scales invisible below turbid water surface. Eyes at exact water level, unblinking. Body creating zero surface disturbance — absolute predatory stillness. Jaw fractionally open.",
  },

  "Grizzly Bear": {
    preAttackSignals: [
      "Head lowers and swings side to side — size display",
      "Huffs twice — final warning vocalizations",
      "Fur on neck and shoulders fully erect — shoulder hump rises",
      "Eyes lock — all peripheral movement ignored",
    ],
    naturalMotion: [
      "Can run 55km/h — faster than any human",
      "Shoulder hump = massive muscle mass for digging and striking",
      "Stands to assess — drops to all-fours to charge",
      "Swipe force: estimated 1,000kg impact — can break elk spine",
    ],
    soundDesign: [
      "Warning: explosive WOOF — sharp and startling",
      "Charge: heavy paw thunder on ground, massive breathing",
      "Impact: deep resonant thud + terrain scatter",
      "Forest/river: water disruption, rocks scatter, ravens call overhead",
    ],
    bodyLanguage: [
      "Head swing = making itself appear maximum size",
      "Shoulder hump raised = attack muscle engaged",
      "Side-to-side walk = warning behavior, not yet committed",
    ],
    habitatFacts: [
      "Charge acceleration: 0-55km/h in 3 seconds",
      "Most charges are bluff — stopping is the test",
      "Rarely provoked — deliberate provocation is the exception",
    ],
    promptInjection:
      "Grizzly shoulder hump fully raised, neck fur erect, head lowering into threat posture. Has already delivered the double huff warning. Eyes absolutely locked, all peripheral attention eliminated. Weight forward on massive forepaws.",
  },

  Eagle: {
    preAttackSignals: [
      "Altitude drops exactly 30% before dive commitment",
      "Wingbeat pattern changes — glide to active flap-lock",
      "Talons open fully — maximum spread span",
      "Head locks downward — eye tracks prey through dive",
    ],
    naturalMotion: [
      "Stoop speed: 160km/h in controlled dive",
      "Adjusts approach trajectory 4x per second",
      "Talons strike at 440 Newtons — breaks small spine immediately",
      "Zero braking — full speed contact is the strategy",
    ],
    soundDesign: [
      "Wind over feathers accelerating — high pitch rising",
      "Wing fold: single snap sound as dive begins",
      "Strike: sharp impact + prey vocalization",
      "Mountain sky: wind rushing, echo, distant territory call",
    ],
    bodyLanguage: [
      "Circling altitude = assessment phase",
      "Talons visible = dive commitment decision made",
      "Head angled down = locked targeting mode",
    ],
    habitatFacts: [
      "Can spot prey from 3km altitude",
      "Adjusts for light refraction when hunting fish",
      "Return to same hunting perch daily for months",
    ],
    promptInjection:
      "Eagle talons spread to maximum span, head locked in precise targeting angle. Feathers compressed aerodynamically. Eye tracking prey through the final dive — wind rushing audible through primary feathers. Altitude dropping at 160km/h.",
  },
};

export function getAnimalBehavior(predator: string): AnimalBehavior | null {
  const behavior = animalBehaviorLibrary[predator];
  if (!behavior) return null;

  return {
    preAttackSignals: behavior.preAttackSignals.map((x) => sanitizeWorkflowPhrase(x)),
    naturalMotion: behavior.naturalMotion.map((x) => sanitizeWorkflowPhrase(x)),
    soundDesign: behavior.soundDesign.map((x) => sanitizeWorkflowPhrase(x)),
    bodyLanguage: behavior.bodyLanguage.map((x) => sanitizeWorkflowPhrase(x)),
    habitatFacts: behavior.habitatFacts.map((x) => sanitizeWorkflowPhrase(x)),
    promptInjection: sanitizeWorkflowPhrase(behavior.promptInjection),
  };
}

// ─────────────────────────────────────────────────────────────
// 2. SOUND DESIGN PACK
// ─────────────────────────────────────────────────────────────
export function buildSoundDesignPack(
  predator: string,
  prey: string,
  arc: Arc,
  weather: Weather,
  klingModel: string
): SoundDesignPack {
  const behavior = getAnimalBehavior(predator);
  const isWinter = weather === "Winter Blizzard" || weather === "Frozen Dusk";
  const isWater = ["Crocodile", "Nile Crocodile", "Shark", "Orca", "Saltwater Crocodile"].includes(predator);
  const isAerial = ["Eagle", "Golden Eagle", "Harpy Eagle", "Bald Eagle"].includes(predator);

  const ambient = sanitizeWorkflowPhrase(
    isWinter
      ? "Cold wind 8-12kHz, distant snow surface creak, low sub-bass 30Hz"
      : isWater
        ? "River current 200-800Hz, drip echo, distant water bird"
        : isAerial
          ? "High altitude wind, thermal updraft, distant echo"
          : "Savanna/forest ambience 400-2000Hz, distant bird, grass movement"
  );

  const impactSFX = sanitizeWorkflowPhrase(
    behavior?.soundDesign[1] ?? "Ground impact + terrain reaction + prey reaction"
  );

  const arcMusic: Partial<Record<Arc, string>> = {
    "Ambush attack": "Silence → single low cello → explosive percussion hit → ambient resolve",
    "Chase and takedown": "Rising pulse rhythm → full orchestral run → sharp cutoff → breathing settle",
    "Defender stands ground": "Low drone build → massive brass hit → triumphant resolve → silence",
    "Giant vs giant clash": "Epic percussion build → full orchestra collision → dramatic settle",
    "Territory dominance battle": "Tension strings → territorial percussion → dominant resolve",
    "Pack hunting strategy": "Minimal percussion pulse → coordinated build → impact → group call",
    "Escape from danger": "Panic strings → desperate percussion → sudden silence OR escape resolve",
    "Predator vs predator fight": "Aggressive percussion duel → chaotic peak → one strong resolve",
  };

  const hasKlingAudio = klingModel === "Kling 3.0 Pro" || klingModel === "Kling 3.0 Standard";

  return {
    shot1_ambient: ambient,
    shot1_animal: sanitizeWorkflowPhrase(
      behavior?.soundDesign[0] ?? "Low controlled vocalization"
    ),
    shot2_impact: sanitizeWorkflowPhrase(
      isWinter
        ? "Ground impact thud + cold terrain reaction"
        : isWater
          ? "Water displacement explosion + jaw impact + turbulence"
          : "Ground impact thud + terrain reaction + body-weight transfer"
    ),
    shot2_animal: sanitizeWorkflowPhrase(
      behavior?.soundDesign[1] ?? `${predator} contact vocalization + ${prey} reaction`
    ),
    shot3_resolve: sanitizeWorkflowPhrase(
      behavior?.soundDesign[2] ?? "Heavy controlled breathing + ambient habitat return"
    ),
    musicMood: arcMusic[arc] ?? "Cinematic wildlife underscore",
    klingAudioPrompt: hasKlingAudio
      ? sanitizeWorkflowPhrase(
          `[Kling Audio Prompt] ${ambient}. At the action beat: ${impactSFX}. Natural wildlife documentary sound design — no music, only environmental and animal audio. Breathing and ground contact clearly audible.`
        )
      : "(Audio only available in Kling 3.0 Pro and Kling 3.0 Standard)",
    capCutSFX: [
      sanitizeWorkflowPhrase(`Shot 1: ${ambient}`),
      sanitizeWorkflowPhrase(
        `Shot 2: ${isWinter ? "Ground thud + cold terrain reaction" : isWater ? "Water explosion" : "Ground thud + terrain reaction"} + ${behavior?.soundDesign[1]?.slice(0, 60) ?? "animal vocalization"}`
      ),
      sanitizeWorkflowPhrase(`Shot 3: Breathing settle + ${ambient.split(",")[0]}`),
      `Music: ${arcMusic[arc]?.split("→")[0] ?? "Low tension build"}`,
    ],
  };
}

// ─────────────────────────────────────────────────────────────
// 3. CAPCUT SCRIPT
// ─────────────────────────────────────────────────────────────
export function buildCapCutScript(
  predator: string,
  prey: string,
  arc: Arc,
  weather: Weather,
  pkg: GeneratedPackage,
  pipelineStyle: "3-shot" | "5-shot"
): CapCutScript {
  const isWinter = weather === "Winter Blizzard" || weather === "Frozen Dusk";
  const hook = pkg.hook2026?.[0] ?? pkg.hook;
  const sfxImpact = sanitizeWorkflowPhrase(
    isWinter ? "Ground thud + cold-air rush" : "Dust scatter + ground thud"
  );

  const musicMood =
    arc === "Giant vs giant clash" || arc === "Defender stands ground"
      ? "Epic orchestral — low drone build → massive impact hit → slow resolve"
      : arc === "Escape from danger"
        ? "Tense pulsing rhythm — escalating tempo → sudden silence → exhale"
        : arc === "Ambush attack"
          ? "Silent tension → single low impact → ambient nature settle"
          : "Cinematic wildlife underscore — slow build, natural peaks";

  const beats3: CapCutBeat[] = [
    {
      timeIn: "0:00",
      timeOut: "0:04",
      shotRef: "Shot 1 — Image / Establishing",
      onScreenText: hook.slice(0, 40),
      transition: "Cut (no transition — hard cut stops scroll)",
      sfx: isWinter ? "Cold wind ambience, low 20Hz sub rumble" : "Natural habitat ambience, distant call",
      musicNote: "Music starts 0:01 — very low volume, slow build",
    },
    {
      timeIn: "0:04",
      timeOut: "0:12",
      shotRef: "Shot 2 — Action / Kling Strike",
      onScreenText: "WATCH CLOSELY 👀",
      transition: "Zoom cut — punch in 1.15x at impact moment",
      sfx: sanitizeWorkflowPhrase(`${sfxImpact} + animal vocalization`),
      musicNote: "Music peak at 0:08 — hard hit on impact frame",
    },
    {
      timeIn: "0:12",
      timeOut: "0:18",
      shotRef: "Shot 3 — Aftermath / Runway",
      onScreenText: "Who won? Comment below 👇",
      transition: "Fade or slow dissolve — let atmosphere breathe",
      sfx: "Breathing settle, wind, distant environment",
      musicNote: "Music resolves — soft outro, fade to nature sound",
    },
  ];

  const beats5: CapCutBeat[] = [
    {
      timeIn: "0:00",
      timeOut: "0:04",
      shotRef: "Shot 1 — Hook Close-up",
      onScreenText: hook.slice(0, 35),
      transition: "Hard cut — instant start, no intro",
      sfx: "Dead silence OR single low breath",
      musicNote: "No music yet — silence builds tension",
    },
    {
      timeIn: "0:04",
      timeOut: "0:14",
      shotRef: "Shot 2 — Standoff / Setup",
      onScreenText: `${predator} vs ${prey}...`,
      transition: "Match cut on eye movement",
      sfx: isWinter ? "Wind, snow surface movement, distant environment" : "Grass movement, distant environment",
      musicNote: "Music enters 0:05 — single low cello note sustained",
    },
    {
      timeIn: "0:14",
      timeOut: "0:26",
      shotRef: "Shot 3 — Tension / Pre-action",
      onScreenText: "WAIT FOR IT... 🔥",
      transition: "Slow zoom cut — 1.05x push in",
      sfx: "Heartbeat sub bass, silence growing",
      musicNote: "Music builds — strings enter, tempo increases slightly",
    },
    {
      timeIn: "0:26",
      timeOut: "0:40",
      shotRef: "Shot 4 — Clash / Impact",
      onScreenText: "😱",
      transition: "Flash cut — 2 frame white flash on impact",
      sfx: sanitizeWorkflowPhrase(`${sfxImpact} + full animal audio`),
      musicNote: "MUSIC PEAK — full orchestra hit, hard sync to impact",
    },
    {
      timeIn: "0:40",
      timeOut: "0:55",
      shotRef: "Shot 5 — Winner Walk / Resolve",
      onScreenText: "Follow for more 🦁",
      transition: "Slow fade in from black",
      sfx: "Breathing, ambient nature, single deep call",
      musicNote: "Music resolves — soft piano or strings fade out",
    },
  ];

  return {
    totalDuration: pipelineStyle === "5-shot" ? "0:55" : "0:18",
    aspectRatio: "9:16 (1080×1920)",
    fps: 24,
    beats: pipelineStyle === "5-shot" ? beats5 : beats3,
    exportSettings: "H.264 | 1080×1920 | 24fps project | 30fps export for upload | 20–25 Mbps | AAC 320kbps",
    musicMood,
  };
}

// ─────────────────────────────────────────────────────────────
// 4. RUNWAY CAMERA PLAN
// ─────────────────────────────────────────────────────────────
export function buildRunwayCameraPlan(
  arc: Arc,
  weather: Weather,
  pipelineStyle: "3-shot" | "5-shot"
): string {
  const winter = weather === "Winter Blizzard" || weather === "Frozen Dusk";

  const map: Record<Arc, { move: string; speed: string; why: string; avoid: string }> = {
    "Ambush attack": {
      move: "Slow dolly-in",
      speed: "2/5",
      why: "Builds dread and keeps the predator grounded without over-moving the frame.",
      avoid: "Avoid orbiting during the strike setup.",
    },
    "Predator vs predator fight": {
      move: "Low tracking move",
      speed: "3/5",
      why: "Keeps body weight and lateral pressure readable before impact.",
      avoid: "Avoid aggressive handheld on the collision beat.",
    },
    "Chase and takedown": {
      move: "Restrained forward tracking",
      speed: "3/5",
      why: "Adds urgency without smearing anatomy.",
      avoid: "Avoid fast zooms that flatten the subject.",
    },
    "Escape from danger": {
      move: "Slight handheld drift",
      speed: "2/5",
      why: "Adds documentary urgency while still preserving readability.",
      avoid: "Avoid whip pans.",
    },
    "Territory dominance battle": {
      move: "Static hold with tiny push-in",
      speed: "1.5/5",
      why: "Dominance scenes land better when the subjects own the frame.",
      avoid: "Avoid constant camera movement.",
    },
    "Pack hunting strategy": {
      move: "Wide tracking move",
      speed: "2.5/5",
      why: "Lets the viewer read multiple bodies and coordinated motion.",
      avoid: "Avoid close handheld unless doing a single wolf reaction.",
    },
    "Defender stands ground": {
      move: "Low-angle push-in",
      speed: "2/5",
      why: "Makes the defender feel massive and immovable.",
      avoid: "Avoid orbiting around the subject.",
    },
    "Giant vs giant clash": {
      move: "Locked wide or very slow dolly-in",
      speed: "1.5/5",
      why: "Scale reads best when both giants stay fully visible.",
      avoid: "Avoid tight crops on impact.",
    },
  };

  const s = map[arc];
  return sanitizeWorkflowPhrase(
    [
      `Primary move: ${s.move} | Speed: ${s.speed}.`,
      `Why: ${s.why}`,
      winter ? "In winter scenes, keep the move restrained so micro-motion and layered depth remain readable." : "",
      `Avoid: ${s.avoid}`,
      pipelineStyle === "5-shot"
        ? "Use the gentlest move on shots 1 and 5; save the strongest move for the action beat only."
        : "For 3-shot reels, keep the move simple so the hook remains readable immediately.",
    ]
      .filter(Boolean)
      .join(" ")
  );
}

// ─────────────────────────────────────────────────────────────
// 5. MOTION BRUSH PLAN
// ─────────────────────────────────────────────────────────────
export function buildMotionBrushPlan(
  predator: string,
  weather: Weather,
  env: string
): string {
  const winter = weather === "Winter Blizzard" || weather === "Frozen Dusk";
  const waterEnv = /river|water|lake|swamp|ocean|coast|estuary/i.test(env);
  const aerial = /eagle|hawk|falcon/i.test(predator);

  return sanitizeWorkflowPhrase(
    [
      "Brush small secondary elements, not the whole body.",
      aerial
        ? "Feather edges / tail fan: intensity 1-2/5, direction follows the glide."
        : "Tail: intensity 1-2/5, direction follows the body line.",
      aerial
        ? "Wingtip or crest micro-motion only if needed: intensity 1/5."
        : "Ear or head-fur micro-motion: intensity 1/5 for realism.",
      winter
        ? "Frozen brush edges or snow-surface detail: intensity 1-2/5 following wind direction. Fur-edge micro-motion: intensity 1/5."
        : waterEnv
          ? "Water surface / splash edges: intensity 2-3/5 following natural flow. Reeds or spray: 1-2/5."
          : "Grass / leaves / dust: intensity 1-2/5 following wind direction.",
      "Avoid painting the entire torso unless you need a specific body deformation. Let the text prompt drive the main action.",
    ].join(" ")
  );
}

// ─────────────────────────────────────────────────────────────
// 6. RUNWAY MOTION PROMPTS
// ─────────────────────────────────────────────────────────────
export function buildRunwayDraftMotionPrompt(
  predator: string,
  prey: string,
  arc: Arc,
  weather: Weather
): string {
  const winter = weather === "Winter Blizzard" || weather === "Frozen Dusk";

  const arcPrompt: Record<Arc, string> = {
    "Ambush attack": "slow stalking advance, head low, shoulders rolling subtly",
    "Predator vs predator fight": "measured forward pressure, bodies tense, one cautious step from each subject",
    "Chase and takedown": "burst of forward acceleration, grounded body weight, restrained tracking energy",
    "Escape from danger": "sudden survival reaction, one backward or lateral escape movement",
    "Territory dominance battle": "dominant hold, chest expanding, one warning step forward",
    "Pack hunting strategy": "coordinated lateral movement, spacing tightening around the target",
    "Defender stands ground": "lowered head, planted stance, one decisive forward step",
    "Giant vs giant clash": "heavy approach, massive weight transfer, impact tension building",
  };

  return sanitizeWorkflowPhrase(
    `${arcPrompt[arc]}, ${winter ? "clean cold-air clarity, restrained cold-environment motion across frame" : "subtle wind through the environment"}, static camera or very slow push-in`
  );
}

export function buildRunwayFinalMotionPrompt(
  predator: string,
  prey: string,
  arc: Arc,
  weather: Weather
): string {
  const winter = weather === "Winter Blizzard" || weather === "Frozen Dusk";

  const arcPrompt: Record<Arc, string> = {
    "Ambush attack": "slow stalking advance with grounded body weight, head low, shoulders rolling with predatory restraint",
    "Predator vs predator fight": "deliberate forward pressure, visible weight transfer through the limbs, one committed reaction beat",
    "Chase and takedown": "controlled surge forward, body fully committed, natural acceleration and deceleration",
    "Escape from danger": "single desperate escape movement, clean body mechanics, immediate terrain reaction",
    "Territory dominance battle": "dominant stillness broken by one warning advance, chest and neck carrying the tension",
    "Pack hunting strategy": "disciplined lateral coordination, spacing tightening, one clear pack movement beat",
    "Defender stands ground": "lowered head, planted stance, powerful forward commitment without breaking silhouette clarity",
    "Giant vs giant clash": "heavy advance, grounded momentum, full-body weight loading before impact",
  };

  return sanitizeWorkflowPhrase(
    `${arcPrompt[arc]}, ${winter ? "clean cold-air clarity, layered cold-environment depth" : "subtle atmospheric motion in the background"}, restrained camera push for documentary realism`
  );
}

// ─────────────────────────────────────────────────────────────
// 7. MOTION-ONLY EXTRACTORS
// ─────────────────────────────────────────────────────────────
function extractPromptLine(longPrompt: string, label: string): string {
  const rx = new RegExp(`${label}\\s*:\\s*([^\\n]+)`, "i");
  return longPrompt.match(rx)?.[1]?.trim() ?? "";
}

function cleanWSTVClause(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\b(the core|movement|motion|subject identity|input frame|documentary realism)\b/gi, (m) => m.toLowerCase())
    .replace(/\s+,/g, ",")
    .replace(/\s+\./g, ".")
    .trim();
}

export function buildWSTVMotionPromptDraftFromKling(
  longPrompt: string,
  fallback: string
): string {
  const camera = extractPromptLine(longPrompt, "Camera motion")
    .replace(/wide tracking or fixed wide,?\s*/i, "fixed wide, ")
    .replace(/whichever keeps full-body physics readable\.?/i, "")
    .replace(/camera motion:?/i, "");

  const subject = extractPromptLine(longPrompt, "Subject action")
    .replace(/executes the core\s*/i, "commits to a single ")
    .replace(/movement/gi, "strike")
    .replace(/reacts once with believable\s*/i, "recoils once and tries ")
    .replace(/or defense response/gi, "to escape")
    .replace(/\s+/g, " ");

  const environment = extractPromptLine(longPrompt, "Environment motion")
    .replace(/debris response, surface displacement, and\s*/i, "")
    .replace(/faint wind movement in distant brush/gi, "faint wind movement")
    .replace(/\s+/g, " ");

  const physics = extractPromptLine(longPrompt, "Physics priority")
    .replace(/grounded weight/gi, "readable impact")
    .replace(/\s+/g, " ");

  const assembled = [camera || "fixed wide", subject, environment, physics]
    .filter(Boolean)
    .join(", ");

  const cleaned = cleanWSTVClause(assembled)
    .replace(/, ,/g, ",")
    .replace(/,\s*$/, "");

  return sanitizeWorkflowPhrase(cleaned.length >= 40 ? cleaned : fallback);
}

export function buildWSTVMotionPromptFinalFromKling(
  longKlingPrompt: string,
  longRunwayPrompt: string,
  fallback: string
): string {
  const camera =
    extractPromptLine(longKlingPrompt, "Camera motion") ||
    extractPromptLine(longRunwayPrompt, "Camera motion");

  const subject = extractPromptLine(longKlingPrompt, "Subject action")
    .replace(/executes the core\s*/i, "commits to a single grounded ")
    .replace(/movement/gi, "strike")
    .replace(/reacts once with believable\s*/i, "reacts once with a sharp ")
    .replace(/or defense response/gi, "escape attempt")
    .replace(/\s+/g, " ");

  const environment = extractPromptLine(longKlingPrompt, "Environment motion")
    .replace(/debris response, surface displacement, and\s*/i, "")
    .replace(/light snow drift/gi, "fine snow drifting diagonally through layered depth")
    .replace(/soft powder displacement/gi, "soft powder displacement on contact")
    .replace(/\s+/g, " ");

  const runwayMood = extractPromptLine(longRunwayPrompt, "Environment motion")
    .replace(/residual atmosphere only —\s*/i, "")
    .replace(/\s+/g, " ");

  const assembled = [
    camera
      ? camera
          .replace(/wide tracking or fixed wide,?\s*/i, "wide tracking with a restrained push, ")
          .replace(/whichever keeps full-body physics readable\.?/i, "")
      : "wide tracking with a restrained push",
    subject,
    environment,
    runwayMood,
    "documentary realism",
  ]
    .filter(Boolean)
    .join(", ");

  const cleaned = cleanWSTVClause(assembled)
    .replace(/, ,/g, ",")
    .replace(/,\s*$/, "");

  return sanitizeWorkflowPhrase(cleaned.length >= 50 ? cleaned : fallback);
}

export function extractMotionOnlyPrompt(longPrompt: string): string {
  const camera = extractPromptLine(longPrompt, "Camera motion");
  const subject = extractPromptLine(longPrompt, "Subject action");
  const environment = extractPromptLine(longPrompt, "Environment motion");
  const physics =
    extractPromptLine(longPrompt, "Physics priority") ||
    extractPromptLine(longPrompt, "Physics");
  const tone =
    extractPromptLine(longPrompt, "Tone") ||
    extractPromptLine(longPrompt, "Mood");
  const audio = extractPromptLine(longPrompt, "Audio");

  const parts = [camera, subject, environment, physics, tone, audio]
    .filter(Boolean)
    .map((p) => p.replace(/\s+/g, " ").trim().replace(/\.$/, ""));

  if (parts.length) return `${parts.join(", ")}.`;

  return sanitizeWorkflowPhrase(
    longPrompt
      .replace(/^[^\n]*SHOT[^\n]*:\s*/i, "")
      .replace(/Runway Gen-[^\n]+\n?/gi, "")
      .replace(/Kling [^\n]+\n?/gi, "")
      .replace(/VEO [^\n]+\n?/gi, "")
      .replace(/Reference[^\n]*\n?/gi, "")
      .replace(/Image-to-video[^\n]*\n?/gi, "")
      .replace(/Single-action[^\n]*\n?/gi, "")
      .replace(/One primary[^\n]*\n?/gi, "")
      .replace(/Do not restate[^\n]*\n?/gi, "")
      .replace(/Keep the uploaded[^\n]*\n?/gi, "")
      .replace(/Use the uploaded[^\n]*\n?/gi, "")
      .replace(/\n{2,}/g, "\n")
      .trim()
  );
}

export function extractMotionOnlyBundle(bundle: string): string {
  return bundle
    .split(/\n{2,}/)
    .map((block) => extractMotionOnlyPrompt(block))
    .filter(Boolean)
    .join("\n\n");
}

// ─────────────────────────────────────────────────────────────
// 8. RUNWAY WORKFLOW PACK
// ─────────────────────────────────────────────────────────────
export function buildRunwayWorkflowPack(
  imagePrompt: string,
  draftMotionPrompt: string,
  finalMotionPrompt: string,
  cameraPlan: string,
  motionBrushPlan: string,
  runwayModel: RunwayModel
): string {
  const finalModel = runwayModel === "Gen-4 Turbo" ? "Gen-4.5" : runwayModel;

  return `${WORKFLOW_PREFIX} WORKFLOW — ${BRAND_NAME}

Node 1: ${WORKFLOW_PREFIX} Image Prompt
Paste the image prompt below into a Text node.

${imagePrompt}

Node 2: ${WORKFLOW_PREFIX} Master Image
Connect the Image Prompt node to a Gen-4 Image node and generate the hero still first.

💡 OPTIONAL LLM NODE:
Add an LLM node between your Text node and the Image node.
Use: Text Input → LLM Node (expand/refine) → Gen-4 Image Node

Node 3: ${WORKFLOW_PREFIX} Motion Prompt Draft
Paste this into a Text node connected to your draft video branch.

${draftMotionPrompt}

Node 4: ${WORKFLOW_PREFIX} Draft Video
Connect Master Image + Motion Prompt Draft → fast draft video node for quick tests.

Node 5: ${WORKFLOW_PREFIX} Motion Prompt Final
Paste this into the final video branch.

${finalMotionPrompt}

Node 6: ${WORKFLOW_PREFIX} Final Video
Connect Master Image + Motion Prompt Final → final-quality video node.
Recommended final model: ${finalModel}.

Camera control suggestion:
${cameraPlan}

Motion Brush suggestion:
${motionBrushPlan}

Rule: image prompt = what it looks like. Video prompt = how it moves.
Credit rule: Before re-running any node, click the clock icon → Node Execution History → restore good outputs without spending credits.`;
}

// ─────────────────────────────────────────────────────────────
// 9. RUNWAY STEP GUIDE
// ─────────────────────────────────────────────────────────────
export function buildRunwayStepGuide(runwayModel: RunwayModel): string {
  const finalModel = runwayModel === "Gen-4 Turbo" ? "Gen-4.5" : runwayModel;

  return `WSTV APP → RUNWAY STEP GUIDE

1. Copy WSTV Image Prompt from the app.
2. Paste it into the ${WORKFLOW_PREFIX} Image Prompt text node.
3. Run ${WORKFLOW_PREFIX} Master Image and approve the hero still first.
4. Copy WSTV Motion Prompt Draft from the app.
5. Paste it into the ${WORKFLOW_PREFIX} Motion Prompt Draft text node.
6. Run ${WORKFLOW_PREFIX} Draft Video for a fast motion test.
7. Check anatomy, motion, camera restraint, and atmosphere.
8. Copy WSTV Motion Prompt Final from the app.
9. Paste it into the ${WORKFLOW_PREFIX} Motion Prompt Final text node.
10. Run ${WORKFLOW_PREFIX} Final Video for the polished render.
11. Use Motion Brush only on small secondary elements: tail, ears, fur edges, snow surface, water edges.
12. Keep the image prompt descriptive and the video prompts motion-only.

Fast branch: ${WORKFLOW_PREFIX} Motion Prompt Draft → ${WORKFLOW_PREFIX} Draft Video
Final branch: ${WORKFLOW_PREFIX} Motion Prompt Final → ${WORKFLOW_PREFIX} Final Video
Recommended final model: ${finalModel}.`;
}

// ─────────────────────────────────────────────────────────────
// 10. TWO-PART VIRAL PRESET
// ─────────────────────────────────────────────────────────────
const HIGH_VALUE_ANIMALS = [
  "Bison",
  "Grizzly Bear",
  "Moose",
  "Bull Elk",
  "Cape Buffalo",
  "Polar Bear",
  "Mountain Lion",
  "Wolf",
  "Black Bear",
];

export function shouldBuildTwoPartViralPreset(
  predator: string,
  prey: string,
  arc: Arc
): boolean {
  return (
    arc === "Giant vs giant clash" ||
    arc === "Defender stands ground" ||
    HIGH_VALUE_ANIMALS.includes(predator) ||
    HIGH_VALUE_ANIMALS.includes(prey)
  );
}

export function buildTwoPartViralPreset(
  predator: string,
  prey: string,
  env: string,
  weather: Weather,
  arc: Arc,
  runwayModel: RunwayModel
): TwoPartViralPreset {
  const finalModel = runwayModel === "Gen-4 Turbo" ? "Gen-4.5" : runwayModel;
  const cleanEnv = sanitizeWorkflowEnv(env);
  const atmosphere = sanitizeWorkflowPhrase(getWorkflowAtmosphere(cleanEnv, weather));

  return {
    overview: sanitizeWorkflowPhrase(
      `2-Part Viral Clash Preset — designed for rare confrontation reels such as ${predator} vs ${prey}. Part 1 sells intimidation + collision. Part 2 sells payoff + winner walk. Keep the same master still across both parts for consistency.`
    ),

    workflowGuide: `${WORKFLOW_PREFIX} 2-PART VIRAL PRESET

PART 1 — Hook + standoff + collision cliffhanger
1. Copy ${WORKFLOW_PREFIX} Image Prompt and build the master still first.
2. Use Part 1 Draft for the fast branch test.
3. Use Part 1 Final for the polished render.
4. End the reel on impact, recoil, or an unresolved clash — do not show the winner.

PART 2 — Aftermath + winner walk payoff
1. Reuse the same master still or the best last frame from Part 1.
2. Use Part 2 Draft for the fast branch test.
3. Use Part 2 Final for the polished render.
4. Show atmosphere settling, the loser in background, and the winner walk past camera.

Best fit: ${arc} in ${cleanEnv} during ${weather}. Recommended final model: ${finalModel}.`,

    part1Hook: `${predator} vs ${prey} — the standoff before the impact. Wait for the collision. 😱`,
    part1Caption:
      "PART 1 — tension, intimidation, and the first collision. Use this reel to stop the scroll and end on the impact or immediate recoil. Do not reveal the final winner yet.",
    part1Draft: sanitizeWorkflowPhrase(
      `${prey.toLowerCase()} threat display, ${predator.toLowerCase()} lowers head and plants stance, wide locked frame, ${atmosphere}, collision tension building`
    ),
    part1Final: sanitizeWorkflowPhrase(
      `${prey.toLowerCase()} rises into intimidation while ${predator.toLowerCase()} holds ground with grounded body weight, wide readable frame, ${atmosphere}, one heavy forward commitment ending on collision or immediate recoil`
    ),

    part2Hook: `After the collision, ${predator} walks forward like nothing happened. Watch the ending. 👀`,
    part2Caption:
      "PART 2 — aftermath, momentum shift, and winner walk. Reuse the same master still or last frame from Part 1 so the animals stay visually locked.",
    part2Draft: sanitizeWorkflowPhrase(
      `aftermath settle, ${predator.toLowerCase()} walks forward slowly, ${prey.toLowerCase()} off-balance or retreating in background, low static camera, ${atmosphere}`
    ),
    part2Final: sanitizeWorkflowPhrase(
      `aftermath with clear momentum shift, ${predator.toLowerCase()} walks forward confidently past camera, ${prey.toLowerCase()} defeated or retreating in background, restrained low-angle documentary camera, ${atmosphere}`
    ),
  };
}

// ─────────────────────────────────────────────────────────────
// 11. UI WORKFLOW PIPELINE PACKS
// ─────────────────────────────────────────────────────────────
export const workflowPipelinePacks: WorkflowPipelinePack[] = [
  {
    id: "3shot",
    name: "3-Shot Pipeline — Fast Viral",
    badge: "15 seconds",
    totalDuration: "0:15",
    summary: "Fast hook → impact → aftermath. Best for quick Reels / Shorts.",
    shots: [
      {
        id: 1,
        title: "Hook / Establishing",
        engine: "RUNWAY",
        durationLabel: "0–4s",
        description: "Extreme close-up tension. Eye lock, body tension, subtle camera push.",
        copyText:
          "SHOT 1 — HOOK CLOSE-UP: close tension, extreme eye lock, subtle muzzle and fur micro-motion, restrained slow push-in, natural wildlife realism, cinematic documentary style.",
      },
      {
        id: 2,
        title: "Action / Strike",
        engine: "KLING",
        durationLabel: "4–10s",
        description: "Main clash, full-body mechanics, dust / debris / impact.",
        copyText:
          "SHOT 2 — ACTION / STRIKE: full-body attack beat, heavy grounded physics, readable impact, dust and debris reaction, dramatic collision, realistic animal mechanics.",
      },
      {
        id: 3,
        title: "Aftermath",
        engine: "RUNWAY",
        durationLabel: "10–15s",
        description: "Movement settles, winner/loser state, cinematic resolve.",
        copyText:
          "SHOT 3 — AFTERMATH: movement settles, posture resets, dust settling, subtle environmental motion, cinematic documentary resolve, restrained camera.",
      },
    ],
  },
  {
    id: "4shot",
    name: "4-Shot Pipeline — Cinematic Story",
    badge: "20 seconds",
    totalDuration: "0:20",
    summary: "Hook → standoff → clash → aftermath. Best balanced format.",
    shots: [
      {
        id: 1,
        title: "Hook Close-up",
        engine: "RUNWAY",
        durationLabel: "0–4s",
        description: "Close-up stare, tension, micro-motion.",
        copyText:
          "SHOT 1 — HOOK CLOSE-UP: close-up stare, subtle fur-edge micro-motion, micro-muscle tension, very slow push-in, dramatic but restrained documentary realism.",
      },
      {
        id: 2,
        title: "Standoff",
        engine: "RUNWAY",
        durationLabel: "4–9s",
        description: "Two animals visible, distance and pressure build.",
        copyText:
          "SHOT 2 — STANDOFF: both animals framed clearly, no sudden movement, tension building, subtle wind or atmosphere, slow camera drift, readable body language.",
      },
      {
        id: 3,
        title: "Clash",
        engine: "KLING",
        durationLabel: "9–15s",
        description: "Main impact with full body physics and terrain reaction.",
        copyText:
          "SHOT 3 — CLASH: full-body impact, maximum readable collision, grounded force transfer, terrain reaction, dust or snow scatter, realistic body mechanics.",
      },
      {
        id: 4,
        title: "Aftermath / Winner Beat",
        engine: "RUNWAY",
        durationLabel: "15–20s",
        description: "Outcome, recoil, dominance or retreat.",
        copyText:
          "SHOT 4 — AFTERMATH: momentum shift, body tension, dominance or retreat, subtle environment recovery, restrained cinematic ending.",
      },
    ],
  },
  {
    id: "5shot",
    name: "5-Shot Pipeline — Watch Time Optimizer",
    badge: "45–55 seconds",
    totalDuration: "0:45–0:55",
    summary: "Hook → build → clash → reaction → ending. Best for Facebook watch time.",
    shots: [
      {
        id: 1,
        title: "Hook Close-up",
        engine: "RUNWAY",
        durationLabel: "0–4s",
        description: "Scroll-stopping tension. Face / eyes / raw dread.",
        copyText:
          "SHOT 1 — HOOK CLOSE-UP: extreme tension, direct eye lock, subtle fur-edge micro-motion, no sudden movement, subtle push-in, immediate scroll-stopping documentary realism.",
      },
      {
        id: 2,
        title: "Build Tension / Standoff",
        engine: "RUNWAY",
        durationLabel: "4–12s",
        description: "Slow setup, distance pressure, suspense grows.",
        copyText:
          "SHOT 2 — STANDOFF: both animals visible, distance and pressure building, subtle camera movement, slow suspense, no attack yet, environment remains alive.",
      },
      {
        id: 3,
        title: "Clash / Impact",
        engine: "KLING",
        durationLabel: "12–22s",
        description: "Main collision. Physics, weight, debris, strongest beat.",
        copyText:
          "SHOT 3 — CLASH: full body collision, realistic weight transfer, dust or snow explosion, strongest impact beat, readable mechanics, cinematic payoff moment.",
      },
      {
        id: 4,
        title: "Reaction / Reversal",
        engine: "KLING",
        durationLabel: "22–32s",
        description: "Stumble, shift, panic, retaliation, unstable momentum.",
        copyText:
          "SHOT 4 — REACTION: post-impact reaction, stumble or reversal, visible body tension, tension still active, momentum unclear, layered terrain response.",
      },
      {
        id: 5,
        title: "Ending / Dominance",
        engine: "RUNWAY",
        durationLabel: "32–55s",
        description: "Winner walk, retreat, calm, unresolved stare, or final dominance.",
        copyText:
          "SHOT 5 — ENDING: dominance or retreat outcome, movement settles, subtle atmosphere, powerful cinematic resolve, restrained documentary ending.",
      },
    ],
  },
];

export function getWorkflowPipelinePack(mode: ShotMode): WorkflowPipelinePack {
  return workflowPipelinePacks.find((pack) => pack.id === mode) ?? workflowPipelinePacks[2];
}