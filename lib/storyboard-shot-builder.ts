import {
  HabitatRegion,
  StoryMode,
  ViolenceLevel,
  type ActionStylePreset,
  type AnimalVibe,
  type Arc,
  type CameraAnglePreset,
  type ContentLane,
  type DepthMode,
  type EmotionalTone,
  type EncounterMode,
  type EndingMode,
  type EscapeDirection,
  type HookFamily,
  type OffspringLabel,
  type Season,
  type StrikeMethod,
  type TimeOfDay,
  type ViralLane,
  type Weather,
  type WeatherHazard,
} from "@/types";

export type StoryboardShotRole = "hook" | "pressure" | "peak" | "resolve";

export type StoryboardShot = {
  id: string;
  shotNumber: 1 | 2 | 3 | 4;
  title: string;
  role: StoryboardShotRole;
  durationSeconds: 5;
  timeRangeLabel: string;
  summary: string;
  imagePrompts: {
    gptImage2Long: string;
    gptImage2Short: string;
    nanoBanana2Long: string;
    nanoBanana2Short: string;
  };
  motionPrompts: {
    kling: string;
  };
  notes: string[];
};

export type CinematicStoryboardInput = {
  storyMode?: StoryMode;
  subjectA?: string;
  subjectB?: string;
  predator?: string;
  prey?: string;
  habitatRegion?: HabitatRegion;
  season?: Season;
  timeOfDay?: TimeOfDay;
  actionStyle?: ActionStylePreset;
  animalVibe?: AnimalVibe;
  arc?: Arc;
  cameraAnglePreset?: CameraAnglePreset;
  contentLane?: ContentLane;
  depthMode?: DepthMode;
  emotionalTone?: EmotionalTone;
  encounterMode?: EncounterMode;
  endingMode?: EndingMode;
  hookMode?: HookFamily | "all";
  viralLane?: ViralLane;
  violenceLevel?: ViolenceLevel;
  weather?: Weather;
  groupCount?: number;
  offspringLabel?: OffspringLabel;
  strikeMethod?: StrikeMethod;
  escapeDirection?: EscapeDirection;
  weatherHazard?: WeatherHazard;
  rutSeason?: boolean;
  foodItem?: string;
  finalEnvironment?: string | null;
  sceneDescription?: string;
  strictOriginalityGuard?: boolean;
};

export type StoryboardSummary = {
  title: string;
  storyMode: StoryMode;
  storyModeLabel: string;
  subjectPair: string;
  subjectA: string;
  subjectB: string;
  habitat: string;
  season: string;
  timeOfDay: string;
  totalShots: 4;
  imageEngines: ["GPT Image 2", "Nano Banana 2"];
  imagePromptVariants: ["GPT Image 2 — Long Version", "GPT Image 2 — Short Version", "Nano Banana 2 — Long Version", "Nano Banana 2 — Short Version"];
  motionEngine: "Kling";
  totalMotionDurationSeconds: 20;
  totalMotionDurationLabel: "20s";
};

export type CinematicStoryboard = {
  summary: StoryboardSummary;
  shots: StoryboardShot[];
  copy: {
    allGptImage2Long: string;
    allGptImage2Short: string;
    allNanoBanana2Long: string;
    allNanoBanana2Short: string;
    allKling: string;
    allStoryboard: string;
  };
};

const DEFAULT_STORY_MODE = StoryMode.PREDATOR_VS_PREY;
const DEFAULT_SUBJECT_A = "Wolf Pack";
const DEFAULT_SUBJECT_B = "Bull Elk";
const DEFAULT_HABITAT = HabitatRegion.YELLOWSTONE;
const DEFAULT_SEASON: Season = "FALL";
const DEFAULT_TIME_OF_DAY: TimeOfDay = "GOLDEN_HOUR";

const SHOT_TIMINGS = [
  { shotNumber: 1, role: "hook", title: "Hook / Opening Tension", timeRangeLabel: "0:00-0:05" },
  { shotNumber: 2, role: "pressure", title: "Pressure Build", timeRangeLabel: "0:05-0:10" },
  { shotNumber: 3, role: "peak", title: "Peak Viral Beat", timeRangeLabel: "0:10-0:15" },
  { shotNumber: 4, role: "resolve", title: "Resolve / Unresolved Replay Ending", timeRangeLabel: "0:15-0:20" },
] as const;

const IMAGE_ENGINES = ["GPT Image 2", "Nano Banana 2"] as const;
const IMAGE_PROMPT_VARIANTS = [
  "GPT Image 2 — Long Version",
  "GPT Image 2 — Short Version",
  "Nano Banana 2 — Long Version",
  "Nano Banana 2 — Short Version",
] as const;
const FULL_BODY_RULE = "Both animals must be full-body visible, fully readable, correctly scaled, grounded, and clearly separated.";
const ANIMAL_CROP_RULE = "Do not crop heads, backs, legs, hooves, paws, tails, horns, shoulders, or body mass.";

const FORBIDDEN_COPY_TERMS = /\b(?:Runway|Seedance|mobile vertical frame)\b/i;
const KLING_STORYBOARD_MAX_CHARS = 2500;

function cleanText(value: unknown, fallback: string): string {
  const text = typeof value === "string" ? value.trim() : "";
  return text || fallback;
}

function formatEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}


function sanitizeCopyablePrompt(text: string): string {
  return text
    .replace(/\bmobile vertical frame\b/gi, "mobile-readable frame")
    .replace(/\baspect ratio\b/gi, "composition format")
    .replace(/\b9:16\b|\b16:9\b/g, "")
    .replace(/\bvertical\b/gi, "mobile-readable")
    .replace(/\bhorizontal\b/gi, "wide-composition")
    .replace(/\bportrait\b/gi, "thumbnail")
    .replace(/\blandscape\b/gi, "habitat")
    .replace(/\bAR\b/g, "format")
    .replace(/\bRunway\b/g, "image-to-video tool")
    .replace(/\bSeedance\b/g, "motion tool")
    .replace(/[^\S\r\n]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function storyModeLabel(storyMode: StoryMode): string {
  return formatEnumLabel(storyMode);
}

function resolveSubjects(input: CinematicStoryboardInput, storyMode: StoryMode) {
  const subjectA =
    storyMode === StoryMode.PREDATOR_VS_PREY
      ? cleanText(input.subjectA ?? input.predator, DEFAULT_SUBJECT_A)
      : cleanText(input.subjectA ?? input.predator, DEFAULT_SUBJECT_A);
  const subjectB =
    storyMode === StoryMode.PREDATOR_VS_PREY
      ? cleanText(input.subjectB ?? input.prey, DEFAULT_SUBJECT_B)
      : cleanText(input.subjectB ?? input.prey, DEFAULT_SUBJECT_B);

  return { subjectA, subjectB };
}

function resolveHabitat(input: CinematicStoryboardInput): string {
  if (input.finalEnvironment?.trim()) return input.finalEnvironment.trim();
  return formatEnumLabel(input.habitatRegion ?? DEFAULT_HABITAT);
}

function resolveSeason(input: CinematicStoryboardInput): string {
  return formatEnumLabel(input.season ?? DEFAULT_SEASON);
}

function resolveTimeOfDay(input: CinematicStoryboardInput): string {
  return formatEnumLabel(input.timeOfDay ?? DEFAULT_TIME_OF_DAY);
}

function resolveWeather(input: CinematicStoryboardInput): string {
  return input.weather ? formatEnumLabel(input.weather) : "Natural wildlife light";
}

function nonGraphicSafetyLine(storyMode: StoryMode): string {
  const base =
    "no blood, no gore, no visible injury, no graphic feeding, no humans, no vehicles, no zoo enclosure, no text, no watermark.";

  if (storyMode === StoryMode.SCAVENGER_CONFLICT) {
    return `${base} Keep the food claim zone non-graphic with the food source obscured, no visible carcass detail, no wounds.`;
  }

  return base;
}

function storyboardStyleLine(): string {
  return [
    "Hand-drawn pencil storyboard look",
    "grayscale sketch",
    "black-and-white graphite drawing",
    "visible pencil strokes",
    "rough but clean linework",
    "light paper texture",
    "soft shading",
    "cinematic storyboard composition",
    "professional film previsualization style",
  ].join(", ");
}

function storyboardVisualDirectionLine(input: CinematicStoryboardInput): string {
  return [
    "Single storyboard frame only",
    "9:16 vertical composition",
    "strong first-frame hook",
    "mobile-readable composition",
    FULL_BODY_RULE,
    ANIMAL_CROP_RULE,
    "full-body readability",
    "clean subject separation",
    "one clear action lane",
    "clear foreground/midground/background depth",
    "strong subject silhouettes",
    "natural blocking",
    "one dominant action beat",
    "non-graphic survival pressure",
    "replay-worthy final frame",
    input.depthMode ? `${input.depthMode} depth planning` : null,
    input.cameraAnglePreset ? `${input.cameraAnglePreset} camera preference` : null,
    input.strictOriginalityGuard ? "fresh composition, no copied viral shot layout" : null,
  ]
    .filter(Boolean)
    .join(", ");
}

function storyboardBehaviorLine(storyMode: StoryMode): string {
  const motherBabyScale =
    storyMode === StoryMode.MOTHER_BABY
      ? " For Mother and Baby shots, keep the cub, calf, fawn, pup, kit, or offspring visibly smaller than the mother and sheltered close without being fused into her body."
      : "";

  return `Preserve realistic animal anatomy, believable scale, grounded hoof/paw/foot contact, natural posture, clean silhouettes, and realistic wildlife behavior.${motherBabyScale}`;
}

function storyboardImageConstraintsLine(storyMode: StoryMode): string {
  return [
    nonGraphicSafetyLine(storyMode).replace(/\.$/, ""),
    "no cartoon style",
    "no anime style",
    "no 3D style",
    "no color rendering",
    "no photorealism",
    "no photorealistic final illustration",
    "no polished final illustration",
    "no polished poster look",
    "no cinematic render",
  ].join(", ");
}

function storyModeShotSummaries(input: {
  storyMode: StoryMode;
  subjectA: string;
  subjectB: string;
  habitat: string;
  foodItem?: string;
  weatherHazard?: WeatherHazard;
  strikeMethod?: StrikeMethod;
  escapeDirection?: EscapeDirection;
  offspringLabel?: OffspringLabel;
}) {
  const a = input.subjectA;
  const b = input.subjectB;
  const hazard = input.weatherHazard ? formatEnumLabel(input.weatherHazard) : b;
  const foodZone =
    input.foodItem && input.foodItem.trim()
      ? "non-graphic food claim zone with the food source obscured by grass and terrain"
      : "non-graphic food claim zone with the food source obscured by grass and terrain";
  const strike = input.strikeMethod ? formatEnumLabel(input.strikeMethod).toLowerCase() : "strike";
  const escape = input.escapeDirection ? formatEnumLabel(input.escapeDirection).toLowerCase() : "escape lane";
  const offspring = input.offspringLabel ? input.offspringLabel : "offspring";

  switch (input.storyMode) {
    case StoryMode.HERD_DEFENSE:
      return [
        `${a} and ${b} are visible immediately as the herd edge becomes the tension line`,
        `${a} tightens formation while ${b} tests the outside lane`,
        `${b} presses closest to the herd edge while the formation holds its ground`,
        `${b} stays outside the guarded line as ${a} finishes in a protected standoff`,
      ];
    case StoryMode.MOTHER_BABY:
      return [
        `${a}, protected ${offspring}, and ${b} are readable in one protective relationship`,
        `${a} body-blocks and shifts the ${offspring} behind her as ${b} closes pressure`,
        `${a} delivers the strongest protective display while ${b} stops short`,
        `${a} keeps the ${offspring} protected as ${b} reassesses from a safer distance`,
      ];
    case StoryMode.RIVAL_CLASH:
      return [
        `${a} and ${b} face off with instant dominance tension`,
        `${a} and ${b} approach through display pressure without contact`,
        `${a} and ${b} hit the strongest near-clash display beat with stable footing`,
        `${a} and ${b} hold an unresolved standoff that invites replay`,
      ];
    case StoryMode.NEAR_MISS:
      return [
        `${a} and ${b} are visible immediately with the escape route readable`,
        `${b} tightens chase pressure as ${a} commits toward the ${escape}`,
        `${a} clears the closest non-graphic near-miss beat as ${b} stops just short`,
        `${a} escapes or continues into uncertainty while ${b} holds the pressure line`,
      ];
    case StoryMode.FISHING_STRIKE:
      return [
        `${a} and the ${b} source are readable at the water edge`,
        `${a} locks focus and positions for a clean ${strike} window`,
        `${a} hits the strongest water-edge ${strike} beat with one readable splash`,
        `${a} settles with the water still moving and the outcome cleanly readable`,
      ];
    case StoryMode.WEATHER_SURVIVAL:
      return [
        `${a} and ${hazard} pressure are instantly visible in ${input.habitat}`,
        `${a} pushes forward against the weather while staying fully readable`,
        `${a} reaches the strongest survival beat against the ${hazard}`,
        `${a} holds an endurance finish with the weather still pressing around it`,
      ];
    case StoryMode.MIGRATION:
      return [
        `${a} movement direction and ${b} route pressure are readable immediately`,
        `${a} advances as the crossing pressure builds across the lane`,
        `${a} reaches the strongest crossing beat while the route remains clear`,
        `${a} continues into distance with a cohesive migration finish`,
      ];
    case StoryMode.SCAVENGER_CONFLICT:
      return [
        `${a}, ${b}, and the ${foodZone} are readable immediately`,
        `${b} circles closer along the claim edge while ${a} guards the line`,
        `${a} shows the strongest non-graphic claim-line pressure as ${b} pauses at the boundary`,
        `${a} holds ownership while ${b} waits back in an unresolved finish`,
      ];
    case StoryMode.PREDATOR_VS_PREY:
    default:
      return [
        `${a} and ${b} are both visible with immediate threat readability`,
        `${a} tests the action lane while ${b} squares up or starts the escape`,
        `${a} and ${b} reach the peak pursuit, near-clash, or defensive beat`,
        `${b} escapes or both animals reassess in unresolved survival tension`,
      ];
  }
}

function roleDirective(role: StoryboardShotRole): string {
  if (role === "hook") {
    return "First frame must be instantly readable with both story forces visible and the conflict clear without sound";
  }
  if (role === "pressure") {
    return "Build pressure through posture, spacing, eye-lines, and controlled movement";
  }
  if (role === "peak") {
    return "Deliver the single strongest viral wildlife beat without contact, injury, or chaotic overlap";
  }
  return "Finish with unresolved or satisfying replay value while keeping the final frame clean and readable";
}

function buildStoryboardPromptContext(args: {
  shot: (typeof SHOT_TIMINGS)[number];
  summary: string;
  input: CinematicStoryboardInput;
  storyMode: StoryMode;
  subjectA: string;
  subjectB: string;
  habitat: string;
  season: string;
  timeOfDay: string;
}) {
  return {
    sceneTitle: `${args.subjectA} vs ${args.subjectB} in ${args.habitat}`,
    setupLine: `${storyModeLabel(args.storyMode)} setup: ${args.subjectA} vs ${args.subjectB}.`,
    beatLine: `${args.summary}. Opening/pressure/peak/ending beat: ${args.shot.title} for ${args.shot.timeRangeLabel}.`,
    habitatLine: `${args.habitat}, ${args.season}, ${args.timeOfDay}, ${resolveWeather(args.input)}. Keep the environment lightly sketched but readable and natural.`,
    visualDirection: storyboardVisualDirectionLine(args.input),
    behaviorLine: storyboardBehaviorLine(args.storyMode),
    constraintsLine: storyboardImageConstraintsLine(args.storyMode),
    roleLine: roleDirective(args.shot.role),
  };
}

function buildGptImage2LongPrompt(args: {
  shot: (typeof SHOT_TIMINGS)[number];
  summary: string;
  input: CinematicStoryboardInput;
  storyMode: StoryMode;
  subjectA: string;
  subjectB: string;
  habitat: string;
  season: string;
  timeOfDay: string;
}) {
  const context = buildStoryboardPromptContext(args);

  return [
    `Shot ${args.shot.shotNumber} — ${args.shot.title}.`,
    "Create a single 9:16 vertical storyboard frame in pencil sketch style, not a multi-panel sheet.",
    "",
    `Scene: ${context.sceneTitle}.`,
    "",
    `Show a powerful ${args.shot.role} moment between ${args.subjectA} and ${args.subjectB} in ${args.habitat}. ${FULL_BODY_RULE} ${ANIMAL_CROP_RULE} ${args.subjectA} and ${args.subjectB} must stay clearly separated with immediate wild conflict and survival tension. The first frame must have a strong visual hook, with both animals instantly readable and the tension clear at first glance.`,
    context.setupLine,
    context.beatLine,
    "",
    "Style:",
    `${storyboardStyleLine()}.`,
    "",
    "Visual direction:",
    `Single storyboard frame only. 9:16 vertical composition. Strong first-frame hook. Mobile-readable composition. ${FULL_BODY_RULE} ${ANIMAL_CROP_RULE} Keep clean subject separation and one clear action lane between the animals. Clear foreground, midground, and background depth. Use strong silhouettes and natural blocking. ${context.visualDirection}. ${context.roleLine}.`,
    "",
    "Habitat:",
    context.habitatLine,
    "",
    "Camera:",
    "Cinematic storyboard framing, slightly low angle or eye-level, wildlife previsualization framing. Use a wide enough frame to show both animals completely while keeping the confrontation dramatic.",
    "",
    "Mood:",
    "Raw tension, quiet pressure, natural conflict, cinematic wildlife realism, strong documentary opening image.",
    "",
    "Behavior and realism:",
    context.behaviorLine,
    "",
    "Important constraints:",
    context.constraintsLine,
    "",
    "Make it look like a professional pencil-drawn wildlife storyboard frame, not a polished final illustration.",
  ].join("\n");
}

function buildGptImage2ShortPrompt(args: {
  shot: (typeof SHOT_TIMINGS)[number];
  summary: string;
  input: CinematicStoryboardInput;
  storyMode: StoryMode;
  subjectA: string;
  subjectB: string;
  habitat: string;
  season: string;
  timeOfDay: string;
}) {
  const context = buildStoryboardPromptContext(args);

  return [
    `Shot ${args.shot.shotNumber} — ${args.shot.title}. Create a single 9:16 vertical pencil sketch storyboard frame of ${args.subjectA} and ${args.subjectB} in ${args.habitat}.`,
    `${FULL_BODY_RULE} ${ANIMAL_CROP_RULE}`,
    `Use grayscale graphite drawing, visible pencil strokes, light paper texture, rough but clean linework, and professional film storyboard style. Show ${args.summary.toLowerCase()} with a strong first-frame hook, cinematic composition, realistic anatomy, clean silhouettes, one clear action lane, and lightly sketched habitat continuity: ${context.habitatLine}`,
    `Constraints: ${context.constraintsLine}.`,
  ].join("\n");
}

function buildNanoBanana2LongPrompt(args: {
  shot: (typeof SHOT_TIMINGS)[number];
  summary: string;
  input: CinematicStoryboardInput;
  storyMode: StoryMode;
  subjectA: string;
  subjectB: string;
  habitat: string;
  season: string;
  timeOfDay: string;
}) {
  const context = buildStoryboardPromptContext(args);

  return [
    `Shot ${args.shot.shotNumber} — ${args.shot.title}. Nano Banana 2 image prompt for a single 9:16 vertical storyboard frame.`,
    "Create a professional pencil-drawn wildlife storyboard frame, not a rendered poster or final illustration.",
    "",
    `Subject frame: ${args.subjectA} vs ${args.subjectB}. ${FULL_BODY_RULE} ${ANIMAL_CROP_RULE}`,
    `${context.beatLine}`,
    "",
    "Image style:",
    "Pencil sketch, grayscale graphite, black-and-white drawing, visible pencil strokes, rough but clean linework, light paper texture, soft shading, professional film previsualization style.",
    "",
    "Composition controls:",
    `9:16 vertical storyboard frame, both animals full-body visible, no animal cropping, clean subject separation, one clear action lane, realistic anatomy and scale, grounded hoof/paw contact, clear silhouettes, mobile-readable staging. ${context.roleLine}.`,
    "",
    "Habitat:",
    `${context.habitatLine} Keep habitat lightly sketched but readable; do not over-render it.`,
    "",
    "Negative controls:",
    `${context.constraintsLine}, no over-polished finish, no glossy render, no copied poster look.`,
  ].join("\n");
}

function buildNanoBanana2ShortPrompt(args: {
  shot: (typeof SHOT_TIMINGS)[number];
  summary: string;
  input: CinematicStoryboardInput;
  storyMode: StoryMode;
  subjectA: string;
  subjectB: string;
  habitat: string;
  season: string;
  timeOfDay: string;
}) {
  const context = buildStoryboardPromptContext(args);

  return [
    `Shot ${args.shot.shotNumber} — ${args.shot.title}. Pencil storyboard, 9:16 vertical, ${args.subjectA} vs ${args.subjectB} in ${args.habitat}.`,
    `${FULL_BODY_RULE} ${ANIMAL_CROP_RULE}`,
    `Clean separation, one clear action lane, realistic anatomy, correct scale, grounded hoof/paw contact, grayscale graphite drawing, visible pencil strokes, light paper texture, lightly sketched habitat. ${args.summary}.`,
    `No color rendering, no photorealism, no photorealistic final illustration, no polished poster look, no cartoon style, no anime style, no 3D style, no text, no watermark, no blood, no gore, no visible injury. ${context.roleLine}.`,
  ].join("\n");
}

function klingSubjectMotion(args: {
  shot: (typeof SHOT_TIMINGS)[number];
  storyMode: StoryMode;
  subjectA: string;
  subjectB: string;
  summary: string;
}) {
  const a = args.subjectA;
  const b = args.subjectB;

  switch (args.storyMode) {
    case StoryMode.HERD_DEFENSE:
      if (args.shot.role === "hook") return `${a} holds a readable herd wall while ${b} watches from outside the line; only small head turns, breath, and weight shifts move at first.`;
      if (args.shot.role === "pressure") return `${a} tightens shoulder spacing as ${b} tests one outside lane; the distance closes slowly without contact.`;
      if (args.shot.role === "peak") return `${b} presses closest to the herd edge while ${a} steps as one guarded wall; this is the strongest boundary-pressure beat.`;
      return `${b} remains held outside the line while ${a} settles back into a protected formation; tension stays unresolved.`;
    case StoryMode.MOTHER_BABY:
      if (args.shot.role === "hook") return `${a} keeps the protected young close while ${b} stays readable in the same threat line; movement is restrained and watchful.`;
      if (args.shot.role === "pressure") return `${a} body-blocks with one deliberate step as ${b} edges closer; the young stays behind the protective body line.`;
      if (args.shot.role === "peak") return `${a} gives the strongest defensive display while ${b} stops short; no impact, only protective pressure.`;
      return `${a} holds the protective position while ${b} reassesses from farther back; the young remains shielded.`;
    case StoryMode.RIVAL_CLASH:
      if (args.shot.role === "hook") return `${a} and ${b} hold dominance posture with locked attention; subtle hoof, paw, head, or shoulder movement keeps the tension alive.`;
      if (args.shot.role === "pressure") return `${a} and ${b} approach through display pressure, closing only one clear lane without collision.`;
      if (args.shot.role === "peak") return `${a} and ${b} hit one peak display or near-clash motion beat, then stabilize with grounded contact.`;
      return `${a} and ${b} pause in an unresolved standoff, breathing visible as the pressure hangs.`;
    case StoryMode.NEAR_MISS:
      if (args.shot.role === "hook") return `${a} and ${b} hold a clear danger read with the escape lane visible; readiness movement stays small and tense.`;
      if (args.shot.role === "pressure") return `${b} closes pursuit pressure while ${a} commits into the escape lane; spacing tightens but remains readable.`;
      if (args.shot.role === "peak") return `${a} makes one decisive dodge through the closest near-miss window as ${b} stops just short without impact.`;
      return `${a} continues out of the pressure line while ${b} slows and reassesses; the ending remains open.`;
    case StoryMode.FISHING_STRIKE:
      if (args.shot.role === "hook") return `${a} holds focused posture at the water edge while the food source area stays readable through ripple and surface movement.`;
      if (args.shot.role === "pressure") return `${a} shifts into strike position with a controlled lean, wing set, paw lift, or head lock; the water surface tightens with anticipation.`;
      if (args.shot.role === "peak") return `${a} performs one clean strike-window motion with a readable splash or grab beat; keep it non-graphic and physically believable.`;
      return `${a} settles as the water continues moving; the outcome is clean, documentary, and not graphic.`;
    case StoryMode.WEATHER_SURVIVAL:
      if (args.shot.role === "hook") return `${a} braces against visible weather pressure with small body adjustments; the survival read is immediate.`;
      if (args.shot.role === "pressure") return `${a} pushes forward through the weather in one steady motion, keeping full-body readability.`;
      if (args.shot.role === "peak") return `${a} hits the strongest endurance beat against wind, snow, rain, dust, or mist while staying grounded.`;
      return `${a} holds an endurance finish as the weather continues around it; the final frame feels resilient.`;
    case StoryMode.MIGRATION:
      if (args.shot.role === "hook") return `${a} establishes a clear movement direction across the route; the group or lead animal moves with measured purpose.`;
      if (args.shot.role === "pressure") return `${a} advances into the crossing pressure with one readable forward surge; spacing remains organized.`;
      if (args.shot.role === "peak") return `${a} reaches the strongest crossing motion beat, pushing through the lane without chaotic overlap.`;
      return `${a} continues into distance with a cohesive migration finish and lingering movement.`;
    case StoryMode.SCAVENGER_CONFLICT:
      if (args.shot.role === "hook") return `${a} guards the claim line while ${b} watches from the edge; the food source remains obscured and non-graphic.`;
      if (args.shot.role === "pressure") return `${b} circles the claim edge in one slow testing move while ${a} stays planted and alert; spacing tightens without contact.`;
      if (args.shot.role === "peak") return `${a} gives the strongest non-graphic display at the boundary while ${b} pauses mid-step; the obscured food source never becomes visible.`;
      return `${a} keeps ownership as ${b} holds back; the food source stays obscured and the standoff remains unresolved.`;
    case StoryMode.PREDATOR_VS_PREY:
    default:
      if (args.shot.role === "hook") return `${a} and ${b} hold a clear threat eye-line with subtle readiness movement; the first frame stays calm enough to read instantly.`;
      if (args.shot.role === "pressure") return `${a} closes pressure through one action lane while ${b} braces, turns, squares up, or begins escape.`;
      if (args.shot.role === "peak") return `${a} and ${b} reach the strongest chase, defensive step, or near-clash beat without graphic contact.`;
      return `${b} escapes, reassesses, or holds just beyond danger while ${a} slows into unresolved survival tension.`;
  }
}

function klingCameraMotion(role: StoryboardShotRole): string {
  if (role === "hook") return "Use one controlled telephoto hold that eases into a slow push-in; keep the first frame readable and avoid sudden movement.";
  if (role === "pressure") return "Use one slight lateral track or hold-then-pressure move that follows the tightening spacing without losing either subject.";
  if (role === "peak") return "Use one low-angle drift or controlled push through the peak beat; no chaotic camera shake, no overcutting, no whip movement.";
  return "Use a steady telephoto hold that settles or pulls back slightly so the final frame feels replay-worthy and readable.";
}

function klingEnvironmentMotion(args: {
  storyMode: StoryMode;
  habitat: string;
  season: string;
  timeOfDay: string;
}) {
  const base = `Keep ${args.habitat}, ${args.season}, ${args.timeOfDay} continuity with small natural motion: grass movement, breath, dust, mist, water ripple, snow, rain, or drifting light atmosphere.`;
  if (args.storyMode === StoryMode.SCAVENGER_CONFLICT) {
    return `${base} Keep the food source obscured by grass and terrain with no visible carcass detail.`;
  }
  return base;
}

function klingContinuity(args: {
  shot: (typeof SHOT_TIMINGS)[number];
  summary: string;
}) {
  if (args.shot.role === "hook") return `Start the sequence with ${args.summary}; preserve a clean readable handoff into the pressure build.`;
  if (args.shot.role === "pressure") return `Continue from the hook by tightening posture and spacing; prepare the single peak beat without resolving it early.`;
  if (args.shot.role === "peak") return `Pay off the setup with the strongest single motion beat, then leave a clean frame that can cut into the ending.`;
  return `Close with unresolved or clean documentary payoff; let the final pose invite replay without showing a graphic outcome.`;
}

function enforceKlingPromptLength(prompt: string) {
  if (prompt.length <= KLING_STORYBOARD_MAX_CHARS) return prompt;

  const safetyMarker = "\n\nSafety:";
  const safetyIndex = prompt.indexOf(safetyMarker);
  if (safetyIndex === -1) return prompt.slice(0, KLING_STORYBOARD_MAX_CHARS).trim();

  const body = prompt.slice(0, safetyIndex).trim();
  const safety = prompt.slice(safetyIndex).trim();
  const maxBodyLength = KLING_STORYBOARD_MAX_CHARS - safety.length - 2;
  return `${body.slice(0, Math.max(0, maxBodyLength)).trim()}\n\n${safety}`;
}

function buildKlingPrompt(args: {
  shot: (typeof SHOT_TIMINGS)[number];
  summary: string;
  input: CinematicStoryboardInput;
  storyMode: StoryMode;
  subjectA: string;
  subjectB: string;
  habitat: string;
  season: string;
  timeOfDay: string;
}) {
  const prompt = [
    "Kling image-to-video, 5 seconds.",
    "Use the storyboard image as the first frame. Preserve the exact animal identities, environment, lighting direction, scale, spacing, and grounded contact from the image.",
    "",
    `Subject motion:\n${klingSubjectMotion(args)}`,
    "",
    `Camera motion:\n${klingCameraMotion(args.shot.role)}`,
    "",
    `Environment motion:\n${klingEnvironmentMotion(args)}`,
    "",
    `Continuity:\n${klingContinuity(args)}`,
    "",
    `Safety:\n${nonGraphicSafetyLine(args.storyMode)}`,
  ].join("\n");

  return enforceKlingPromptLength(sanitizeCopyablePrompt(prompt));
}

function buildNotes(args: {
  shot: (typeof SHOT_TIMINGS)[number];
  storyMode: StoryMode;
  subjectA: string;
  subjectB: string;
}) {
  return [
    `${args.shot.timeRangeLabel} is exactly 5 seconds; generate this shot as its own unit.`,
    "Use the image prompt first, then paste the Kling prompt for motion.",
    args.storyMode === StoryMode.SCAVENGER_CONFLICT
      ? "Food-zone detail must stay obscured and animal-free except for the two active subjects."
      : "Keep behavior documentary-realistic and avoid fantasy escalation.",
    `Continuity lock: ${args.subjectA} and ${args.subjectB} should keep stable identity, scale, silhouettes, and spacing.`,
  ];
}

function assertCopyablePromptSafety(storyboard: CinematicStoryboard) {
  const allPromptText = storyboard.shots
    .flatMap((shot) => [
      shot.imagePrompts.gptImage2Long,
      shot.imagePrompts.gptImage2Short,
      shot.imagePrompts.nanoBanana2Long,
      shot.imagePrompts.nanoBanana2Short,
      shot.motionPrompts.kling,
    ])
    .join("\n");

  if (FORBIDDEN_COPY_TERMS.test(allPromptText)) {
    throw new Error("Storyboard prompt contains forbidden copy wording.");
  }
}

function buildBulkCopy(shots: StoryboardShot[], selector: (shot: StoryboardShot) => string) {
  return shots
    .map((shot) => [`Shot ${shot.shotNumber} — ${shot.timeRangeLabel} — ${shot.title}`, selector(shot)].join("\n"))
    .join("\n\n---\n\n");
}

export function buildCinematicStoryboard(input: CinematicStoryboardInput = {}): CinematicStoryboard {
  const storyMode = input.storyMode ?? DEFAULT_STORY_MODE;
  const { subjectA, subjectB } = resolveSubjects(input, storyMode);
  const habitat = resolveHabitat(input);
  const season = resolveSeason(input);
  const timeOfDay = resolveTimeOfDay(input);
  const summaries = storyModeShotSummaries({
    storyMode,
    subjectA,
    subjectB,
    habitat,
    foodItem: input.foodItem,
    weatherHazard: input.weatherHazard,
    strikeMethod: input.strikeMethod,
    escapeDirection: input.escapeDirection,
    offspringLabel: input.offspringLabel,
  });

  const shots = SHOT_TIMINGS.map((shot, index): StoryboardShot => {
    const summary = summaries[index];
    const promptArgs = {
      shot,
      summary,
      input,
      storyMode,
      subjectA,
      subjectB,
      habitat,
      season,
      timeOfDay,
    };

    return {
      id: `shot-${shot.shotNumber}`,
      shotNumber: shot.shotNumber,
      title: `Shot ${shot.shotNumber} — ${shot.timeRangeLabel} — ${shot.title}`,
      role: shot.role,
      durationSeconds: 5,
      timeRangeLabel: shot.timeRangeLabel,
      summary,
      imagePrompts: {
        gptImage2Long: buildGptImage2LongPrompt(promptArgs),
        gptImage2Short: buildGptImage2ShortPrompt(promptArgs),
        nanoBanana2Long: buildNanoBanana2LongPrompt(promptArgs),
        nanoBanana2Short: buildNanoBanana2ShortPrompt(promptArgs),
      },
      motionPrompts: {
        kling: buildKlingPrompt(promptArgs),
      },
      notes: buildNotes({ shot, storyMode, subjectA, subjectB }),
    };
  });

  const summary: StoryboardSummary = {
    title: `${storyModeLabel(storyMode)}: ${subjectA} vs ${subjectB}`,
    storyMode,
    storyModeLabel: storyModeLabel(storyMode),
    subjectPair: `${subjectA} vs ${subjectB}`,
    subjectA,
    subjectB,
    habitat,
    season,
    timeOfDay,
    totalShots: 4,
    imageEngines: [...IMAGE_ENGINES],
    imagePromptVariants: [...IMAGE_PROMPT_VARIANTS],
    motionEngine: "Kling",
    totalMotionDurationSeconds: 20,
    totalMotionDurationLabel: "20s",
  };

  const storyboard: CinematicStoryboard = {
    summary,
    shots,
    copy: {
      allGptImage2Long: buildBulkCopy(shots, (shot) => shot.imagePrompts.gptImage2Long),
      allGptImage2Short: buildBulkCopy(shots, (shot) => shot.imagePrompts.gptImage2Short),
      allNanoBanana2Long: buildBulkCopy(shots, (shot) => shot.imagePrompts.nanoBanana2Long),
      allNanoBanana2Short: buildBulkCopy(shots, (shot) => shot.imagePrompts.nanoBanana2Short),
      allKling: buildBulkCopy(shots, (shot) => shot.motionPrompts.kling),
      allStoryboard: [
        `Storyboard Summary: ${summary.title}`,
        `Story Mode: ${summary.storyModeLabel}`,
        `Subject Pair: ${summary.subjectPair}`,
        `Habitat: ${summary.habitat}`,
        `Total Shots: ${summary.totalShots}`,
        `Total Motion Duration: ${summary.totalMotionDurationLabel}`,
        "",
        ...shots.map((shot) =>
          [
            shot.title,
            `Role: ${shot.role}`,
            `Summary: ${shot.summary}`,
            "GPT Image 2 — Long Version:",
            shot.imagePrompts.gptImage2Long,
            "GPT Image 2 — Short Version:",
            shot.imagePrompts.gptImage2Short,
            "Nano Banana 2 — Long Version:",
            shot.imagePrompts.nanoBanana2Long,
            "Nano Banana 2 — Short Version:",
            shot.imagePrompts.nanoBanana2Short,
            "Kling Motion:",
            shot.motionPrompts.kling,
            "Notes:",
            shot.notes.join("\n"),
          ].join("\n")
        ),
      ].join("\n\n---\n\n"),
    },
  };

  assertCopyablePromptSafety(storyboard);
  return storyboard;
}

