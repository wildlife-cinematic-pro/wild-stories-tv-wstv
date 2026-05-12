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
    nanoBanana2: string;
    gptImage2: string;
    grokImagine: string;
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
  imageEngines: ["Nano Banana 2", "GPT Image 2", "Grok Imagine"];
  motionEngine: "Kling";
  totalMotionDurationSeconds: 20;
  totalMotionDurationLabel: "20s";
};

export type CinematicStoryboard = {
  summary: StoryboardSummary;
  shots: StoryboardShot[];
  copy: {
    allNanoBanana2: string;
    allGptImage2: string;
    allGrokImagine: string;
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

const IMAGE_ENGINES = ["Nano Banana 2", "GPT Image 2", "Grok Imagine"] as const;

const FORBIDDEN_COPY_TERMS =
  /\b(?:9:16|16:9|vertical|horizontal|portrait|landscape|aspect ratio|AR|Runway|Seedance|mobile vertical frame)\b/i;

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
    .replace(/\s{2,}/g, " ")
    .trim();
}

function asSentence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function joinSentences(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .map(asSentence)
    .join(" ");
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

function cinematicStyleLine(input: CinematicStoryboardInput): string {
  return [
    "Strong first-frame hook",
    "mobile-readable composition",
    "strong thumbnail readability",
    "full-body readability",
    "clean subject separation",
    "one clear action lane",
    "clear foreground/midground/background depth",
    "cinematic wildlife documentary realism",
    "telephoto compression or low-angle cinematic feel",
    "controlled motion, not chaotic action",
    "one dominant action beat",
    "non-graphic survival pressure",
    "replay-worthy final frame",
    input.animalVibe ? `${input.animalVibe} behavior tone` : null,
    input.emotionalTone ? `${input.emotionalTone} emotional tone` : null,
    input.depthMode ? `${input.depthMode} depth treatment` : null,
    input.cameraAnglePreset ? `${input.cameraAnglePreset} camera preference` : null,
    input.strictOriginalityGuard ? "fresh composition, no copied viral shot layout" : null,
  ]
    .filter(Boolean)
    .join(", ");
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

function buildImagePrompt(args: {
  engine: "Nano Banana 2" | "GPT Image 2" | "Grok Imagine";
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
  const engineTone =
    args.engine === "Nano Banana 2"
      ? "reference-stable cinematic master image prompt"
      : args.engine === "GPT Image 2"
        ? "clean composition backup image prompt"
        : "high-impact realistic image prompt";

  return sanitizeCopyablePrompt(joinSentences([
    `${args.engine} ${engineTone}`,
    `Shot ${args.shot.shotNumber}, ${args.shot.timeRangeLabel}, ${args.shot.title}`,
    `${storyModeLabel(args.storyMode)} setup: ${args.subjectA} vs ${args.subjectB}`,
    `${args.summary}`,
    `Location continuity: ${args.habitat}, ${args.season}, ${args.timeOfDay}, ${resolveWeather(args.input)}`,
    `Visual direction: ${cinematicStyleLine(args.input)}`,
    roleDirective(args.shot.role),
    "Preserve realistic wildlife behavior, correct animal scale, stable anatomy, grounded contact, clean silhouettes, and natural documentary tension",
    nonGraphicSafetyLine(args.storyMode),
  ]));
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
  const motion =
    args.shot.role === "hook"
      ? "telephoto hold into a slow push-in"
      : args.shot.role === "pressure"
        ? "slight lateral tracking with hold-then-pressure timing"
        : args.shot.role === "peak"
          ? "low-angle drift into a controlled pressure beat"
          : "telephoto hold with a subtle settling move";

  return sanitizeCopyablePrompt(joinSentences([
    `Kling motion prompt for Shot ${args.shot.shotNumber}`,
    "Duration: 5 seconds",
    `Continue from the shot image concept: ${args.summary}`,
    `${storyModeLabel(args.storyMode)} subjects: ${args.subjectA} vs ${args.subjectB}`,
    `Keep environment continuity in ${args.habitat}, ${args.season}, ${args.timeOfDay}`,
    `Controlled cinematic camera motion: ${motion}`,
    "Keep the first frame readable, both subjects fully visible when the story needs both, clean subject separation, one clear action lane, and clear foreground/midground/background depth",
    "Use one dominant motion beat only, no overcutting, no chaotic camera shake, realistic animal physics, stable anatomy, grounded contact, correct scale",
    nonGraphicSafetyLine(args.storyMode),
  ]));
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
      shot.imagePrompts.nanoBanana2,
      shot.imagePrompts.gptImage2,
      shot.imagePrompts.grokImagine,
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
    return {
      id: `shot-${shot.shotNumber}`,
      shotNumber: shot.shotNumber,
      title: `Shot ${shot.shotNumber} — ${shot.timeRangeLabel} — ${shot.title}`,
      role: shot.role,
      durationSeconds: 5,
      timeRangeLabel: shot.timeRangeLabel,
      summary,
      imagePrompts: {
        nanoBanana2: buildImagePrompt({
          engine: "Nano Banana 2",
          shot,
          summary,
          input,
          storyMode,
          subjectA,
          subjectB,
          habitat,
          season,
          timeOfDay,
        }),
        gptImage2: buildImagePrompt({
          engine: "GPT Image 2",
          shot,
          summary,
          input,
          storyMode,
          subjectA,
          subjectB,
          habitat,
          season,
          timeOfDay,
        }),
        grokImagine: buildImagePrompt({
          engine: "Grok Imagine",
          shot,
          summary,
          input,
          storyMode,
          subjectA,
          subjectB,
          habitat,
          season,
          timeOfDay,
        }),
      },
      motionPrompts: {
        kling: buildKlingPrompt({
          shot,
          summary,
          input,
          storyMode,
          subjectA,
          subjectB,
          habitat,
          season,
          timeOfDay,
        }),
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
    motionEngine: "Kling",
    totalMotionDurationSeconds: 20,
    totalMotionDurationLabel: "20s",
  };

  const storyboard: CinematicStoryboard = {
    summary,
    shots,
    copy: {
      allNanoBanana2: buildBulkCopy(shots, (shot) => shot.imagePrompts.nanoBanana2),
      allGptImage2: buildBulkCopy(shots, (shot) => shot.imagePrompts.gptImage2),
      allGrokImagine: buildBulkCopy(shots, (shot) => shot.imagePrompts.grokImagine),
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
            "Nano Banana 2:",
            shot.imagePrompts.nanoBanana2,
            "GPT Image 2:",
            shot.imagePrompts.gptImage2,
            "Grok Imagine:",
            shot.imagePrompts.grokImagine,
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

