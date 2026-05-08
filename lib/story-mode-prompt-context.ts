import type {
  CameraAnglePreset,
  DurationLane,
  EncounterMode,
  EndingMode,
  EscapeDirection,
  GeneratedPackage,
  HabitatRegion,
  KlingModel,
  OffspringLabel,
  RunwayModel,
  Season,
  ShotImagePlan,
  StoryMode,
  StrikeMethod,
  StructuredPrompt,
  StructuredPromptMetadata,
  TimeOfDay,
  ViralLane,
  ViolenceLevel,
  Weather,
  WeatherHazard,
} from "@/types";
import {
  EndingMode as EndingModeEnum,
  HabitatRegion as HabitatRegionEnum,
  StoryMode as StoryModeEnum,
  ViolenceLevel as ViolenceLevelEnum,
} from "@/types";

export type StoryModePromptContextInput = {
  storyMode?: StoryMode;
  encounterMode?: EncounterMode;
  endingMode?: EndingMode;
  viralLane?: ViralLane;
  violenceLevel?: ViolenceLevel;
  habitatRegion?: HabitatRegion;
  season?: Season;
  timeOfDay?: TimeOfDay;
  subjectA?: string;
  subjectB?: string;
  groupCount?: number;
  offspringLabel?: OffspringLabel;
  strikeMethod?: StrikeMethod;
  escapeDirection?: EscapeDirection;
  weatherHazard?: WeatherHazard;
  rutSeason?: boolean;
  foodItem?: string;
  predator?: string;
  prey?: string;
  finalEnvironment?: string;
  weather?: Weather;
  cameraAnglePreset?: CameraAnglePreset;
  runwayModel?: RunwayModel;
  klingModel?: KlingModel;
  durationLane?: DurationLane;
};

export type StoryModePromptContext = {
  storyMode: StoryMode;
  modeLabel: string;
  primarySubjectLabel: string;
  secondarySubjectLabel: string;
  groupLine: string;
  relationshipLine: string;
  sceneGoal: string;
  safetyLine: string;
  violenceLine: string;
  modeSpecificActionLine: string;
  endingLine: string;
  facebookHookAngle: string;
  caption: string;
  environmentLine: string;
  shotStages: Array<{
    title: string;
    stage: string;
    imageDirection: string;
    motionDirection: string;
  }>;
};

const MODE_LABELS: Record<StoryMode, string> = {
  [StoryModeEnum.PREDATOR_VS_PREY]: "Predator vs Prey",
  [StoryModeEnum.HERD_DEFENSE]: "Herd Defense",
  [StoryModeEnum.MOTHER_BABY]: "Mother & Baby",
  [StoryModeEnum.RIVAL_CLASH]: "Rival Clash",
  [StoryModeEnum.NEAR_MISS]: "Near-Miss Escape",
  [StoryModeEnum.FISHING_STRIKE]: "Fishing Strike",
  [StoryModeEnum.WEATHER_SURVIVAL]: "Weather Survival",
  [StoryModeEnum.MIGRATION]: "Migration Crossing",
  [StoryModeEnum.SCAVENGER_CONFLICT]: "Scavenger Conflict",
};

const HABITAT_LABELS: Record<HabitatRegion, string> = {
  [HabitatRegionEnum.YELLOWSTONE]: "Yellowstone",
  [HabitatRegionEnum.ALASKA]: "Alaska",
  [HabitatRegionEnum.GREAT_PLAINS]: "Great Plains",
  [HabitatRegionEnum.PACIFIC_NORTHWEST]: "Pacific Northwest",
  [HabitatRegionEnum.EVERGLADES]: "Everglades",
  [HabitatRegionEnum.ROCKY_MOUNTAINS]: "Rocky Mountains",
  [HabitatRegionEnum.APPALACHIA]: "Appalachia",
  [HabitatRegionEnum.SOUTHWEST_DESERT]: "Southwest Desert",
  [HabitatRegionEnum.COASTAL_WETLANDS]: "Coastal Wetlands",
};

const DEFAULTS: Record<
  Exclude<StoryMode, StoryModeEnum.PREDATOR_VS_PREY>,
  {
    subjectA: string;
    subjectB: string;
    groupCount?: number;
    offspringLabel?: OffspringLabel;
    strikeMethod?: StrikeMethod;
    escapeDirection?: EscapeDirection;
    weatherHazard?: WeatherHazard;
    rutSeason?: boolean;
    foodItem?: string;
  }
> = {
  [StoryModeEnum.HERD_DEFENSE]: {
    subjectA: "Bison Herd",
    subjectB: "Wolf Pack",
    groupCount: 12,
  },
  [StoryModeEnum.MOTHER_BABY]: {
    subjectA: "Grizzly Mother",
    subjectB: "Male Grizzly",
    offspringLabel: "cub",
  },
  [StoryModeEnum.RIVAL_CLASH]: {
    subjectA: "Bull Elk A",
    subjectB: "Bull Elk B",
    rutSeason: true,
  },
  [StoryModeEnum.NEAR_MISS]: {
    subjectA: "White-tailed Deer",
    subjectB: "Mountain Lion",
    escapeDirection: "BRUSH",
  },
  [StoryModeEnum.FISHING_STRIKE]: {
    subjectA: "Grizzly Bear",
    subjectB: "Sockeye Salmon",
    strikeMethod: "SWIPE",
  },
  [StoryModeEnum.WEATHER_SURVIVAL]: {
    subjectA: "American Bison",
    subjectB: "Blizzard",
    groupCount: 8,
    weatherHazard: "BLIZZARD",
  },
  [StoryModeEnum.MIGRATION]: {
    subjectA: "Caribou Herd",
    subjectB: "River Crossing",
    groupCount: 250,
  },
  [StoryModeEnum.SCAVENGER_CONFLICT]: {
    subjectA: "Bald Eagle",
    subjectB: "Coyote",
    foodItem: "Deer carcass zone",
  },
};

const SAFETY_LINE =
  "Safety: clean survival tension only, no gore, no blood, no visible injury, no torn flesh, no exposed injury, no broken bones, no dead animal, no humans, no vehicles, no fences, no zoo enclosure.";

const REALISM_LOCK =
  "Photorealistic wildlife documentary realism, stable animal anatomy, grounded paw/hoof/foot contact, full-body readability, believable scale, clean subject separation, natural habitat detail, no text, no watermark.";

function cleanText(value: unknown, fallback: string) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function titleCaseEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function safeStoryMode(value?: StoryMode): StoryMode {
  return value ?? StoryModeEnum.PREDATOR_VS_PREY;
}

export function isNonPredatorStoryMode(input: StoryModePromptContextInput) {
  return safeStoryMode(input.storyMode) !== StoryModeEnum.PREDATOR_VS_PREY;
}

function getModeDefaults(storyMode: StoryMode) {
  return storyMode === StoryModeEnum.PREDATOR_VS_PREY
    ? undefined
    : DEFAULTS[storyMode as Exclude<StoryMode, StoryModeEnum.PREDATOR_VS_PREY>];
}

function buildViolenceLine(value?: ViolenceLevel) {
  if (value === ViolenceLevelEnum.NON_GRAPHIC_STRUGGLE) {
    return "Violence level 3: brief non-graphic physical pressure or struggle may be implied, but the frame must still show no gore, no blood, and no visible injury.";
  }

  if (value === ViolenceLevelEnum.IMPLIED_PRESSURE) {
    return "Violence level 2: implied pressure and near-contact are allowed, but no injury, no impact wound, and no graphic result.";
  }

  return "Violence level 1: display, posture, spacing, and survival pressure only; no contact, no clash, no bite, no strike impact.";
}

function buildEndingLine(mode?: EndingMode) {
  switch (mode) {
    case EndingModeEnum.STANDOFF:
      return "Ending: unresolved standoff with both sides still readable and no graphic outcome.";
    case EndingModeEnum.DOMINANT_WIN:
      return "Ending: dominance read through posture and space control only, with no visible injury.";
    case EndingModeEnum.PROTECTED_EXIT:
      return "Ending: protected exit, the vulnerable subject stays sheltered while tension remains.";
    case EndingModeEnum.SEASONAL_DEPARTURE:
      return "Ending: seasonal departure, movement continues beyond the frame and the survival question remains open.";
    case EndingModeEnum.UNRESOLVED:
      return "Ending: unresolved survival tension that invites replay without showing harm.";
    case EndingModeEnum.ESCAPE:
    default:
      return "Ending: clean escape or survival reset, no injury shown, final frame still feels unresolved.";
  }
}

function buildEnvironmentLine(input: StoryModePromptContextInput) {
  const habitatRegion = input.habitatRegion ?? HabitatRegionEnum.YELLOWSTONE;
  const region = HABITAT_LABELS[habitatRegion] ?? titleCaseEnum(habitatRegion);
  const season = titleCaseEnum(input.season ?? "FALL");
  const timeOfDay = titleCaseEnum(input.timeOfDay ?? "GOLDEN_HOUR");
  const environment = cleanText(input.finalEnvironment, `${region} wildlife habitat`);
  const weather = cleanText(input.weather, "natural documentary weather");

  return `${environment}; ${region}; ${season}; ${timeOfDay}; ${weather}.`;
}

function buildModeLines(input: StoryModePromptContextInput) {
  const storyMode = safeStoryMode(input.storyMode);
  const defaults = getModeDefaults(storyMode);
  const subjectA = cleanText(input.subjectA, defaults?.subjectA ?? input.predator ?? "Lead animal");
  const subjectB = cleanText(input.subjectB, defaults?.subjectB ?? input.prey ?? "Opposite animal");
  const groupCount = input.groupCount ?? defaults?.groupCount;
  const offspringLabel = input.offspringLabel ?? defaults?.offspringLabel ?? "cub";
  const strikeMethod = input.strikeMethod ?? defaults?.strikeMethod ?? "AMBUSH";
  const escapeDirection = input.escapeDirection ?? defaults?.escapeDirection ?? "BRUSH";
  const weatherHazard = input.weatherHazard ?? defaults?.weatherHazard ?? "BLIZZARD";
  const rutSeason = input.rutSeason ?? defaults?.rutSeason ?? false;
  const foodItem = cleanText(input.foodItem, defaults?.foodItem ?? "non-graphic food zone");

  switch (storyMode) {
    case StoryModeEnum.HERD_DEFENSE:
      return {
        subjectA,
        subjectB,
        groupLine: groupCount
          ? `Group count target: show roughly ${groupCount} herd animals where composition allows.`
          : "Group count target: show the herd as a readable defensive group.",
        relationshipLine: `${subjectA} forms a defensive wall while ${subjectB} pressures the edge of the open lane.`,
        sceneGoal:
          "Herd defense sequence with full herd readability, group formation, threat pressure outside the formation, and no kill shown.",
        modeSpecificActionLine:
          "Use herd formation, shoulder-to-shoulder grouping, edge pressure, and a clean standoff lane as the main action language.",
        facebookHookAngle: "The herd closes ranks first",
      };
    case StoryModeEnum.MOTHER_BABY:
      return {
        subjectA,
        subjectB,
        groupLine: `Offspring label: ${offspringLabel}; keep the young sheltered close to the mother.`,
        relationshipLine: `${subjectA} shields the ${offspringLabel} while ${subjectB} stays at a readable distance.`,
        sceneGoal:
          "Protective mother and offspring survival sequence with emotional tension, threat at distance, no contact, and no injury.",
        modeSpecificActionLine:
          "Use protective body blocking, sheltered offspring placement, distance threat pressure, and grounded maternal posture.",
        facebookHookAngle: "The mother moves before the threat does",
      };
    case StoryModeEnum.RIVAL_CLASH:
      return {
        subjectA,
        subjectB,
        groupLine: rutSeason ? "Rut season enabled: show dominance posture without graphic injury." : "Rut season off: keep the rivalry territorial and posture-led.",
        relationshipLine: `${subjectA} and ${subjectB} square off in same-species dominance tension.`,
        sceneGoal:
          "Rival clash sequence with antler, horn, shoulder, or body-display pressure and a clean dominance standoff.",
        modeSpecificActionLine:
          "Use lowered heads, planted footing, body display, dust-free grounded stance, and non-graphic standoff pressure.",
        facebookHookAngle: "Neither rival gives up the line",
      };
    case StoryModeEnum.NEAR_MISS:
      return {
        subjectA,
        subjectB,
        groupLine: `Escape direction: ${titleCaseEnum(escapeDirection)}.`,
        relationshipLine: `${subjectA} cuts toward ${titleCaseEnum(escapeDirection).toLowerCase()} as ${subjectB} closes the gap in a last-second escape.`,
        sceneGoal:
          "Near-miss escape sequence with a clear escape lane, last-second turn, near-clash without contact, and fast readable motion.",
        modeSpecificActionLine:
          "Use readable turn mechanics, open escape geometry, near-miss spacing, and fast but grounded survival movement.",
        facebookHookAngle: "The escape lane opens at the last second",
      };
    case StoryModeEnum.FISHING_STRIKE:
      return {
        subjectA,
        subjectB,
        groupLine: `Strike method: ${titleCaseEnum(strikeMethod)}; keep the food source non-graphic and readable.`,
        relationshipLine: `${subjectA} uses a realistic ${titleCaseEnum(strikeMethod).toLowerCase()} toward ${subjectB} at the waterline.`,
        sceneGoal:
          "Fishing strike sequence with waterline action, realistic feeding behavior, readable splash, and no gore.",
        modeSpecificActionLine:
          "Use riverbank footing, water splash, food-source timing, realistic strike posture, and clean documentary feeding tension.",
        facebookHookAngle: "The waterline gives it away first",
      };
    case StoryModeEnum.WEATHER_SURVIVAL:
      return {
        subjectA,
        subjectB,
        groupLine: groupCount
          ? `Group count target: show roughly ${groupCount} animals enduring the hazard.`
          : "Group count target: keep the survival group readable.",
        relationshipLine: `${subjectA} pushes through ${titleCaseEnum(weatherHazard).toLowerCase()} conditions with survival movement and no fight required.`,
        sceneGoal:
          "Weather survival sequence with a natural hazard, endurance movement, visible environmental pressure, and no animal fight.",
        modeSpecificActionLine:
          "Use wind, ice, floodwater, drought heat, or blizzard pressure as the antagonist while animals keep grounded survival motion.",
        facebookHookAngle: "The weather becomes the opponent",
      };
    case StoryModeEnum.MIGRATION:
      return {
        subjectA,
        subjectB,
        groupLine: groupCount
          ? `Migration scale target: show roughly ${groupCount} animals where wide framing allows.`
          : "Migration scale target: show route and herd movement clearly.",
        relationshipLine: `${subjectA} approaches ${subjectB} with migration pressure rising across the route.`,
        sceneGoal:
          "Migration crossing sequence with herd movement, obstacle readability, route pressure, and wide documentary scale.",
        modeSpecificActionLine:
          "Use lead animals, crossing hesitation, herd compression, route depth, and readable terrain as the core movement language.",
        facebookHookAngle: "The crossing point decides the frame",
      };
    case StoryModeEnum.SCAVENGER_CONFLICT:
      return {
        subjectA,
        subjectB,
        groupLine: `Food zone: ${foodItem}; keep it non-graphic and partially obscured if visible.`,
        relationshipLine: `${subjectA} guards ${foodItem} while ${subjectB} circles the edge in a non-graphic ownership conflict.`,
        sceneGoal:
          "Scavenger conflict sequence with ownership tension around a non-graphic food zone and no visible carcass gore.",
        modeSpecificActionLine:
          "Use guarding posture, circling pressure, spacing, claim-line tension, and clean wildlife behavior instead of graphic feeding.",
        facebookHookAngle: "The claim line is already drawn",
      };
    case StoryModeEnum.PREDATOR_VS_PREY:
    default:
      return {
        subjectA,
        subjectB,
        groupLine: "",
        relationshipLine: `${subjectA} pressures ${subjectB} in a clean predator-prey survival lane.`,
        sceneGoal: "Predator vs prey survival tension.",
        modeSpecificActionLine: "Use clean pressure, reaction, escape geometry, and realistic animal motion.",
        facebookHookAngle: "The pressure line closes fast",
      };
  }
}

function buildShotStages(context: Omit<StoryModePromptContext, "shotStages">) {
  const noContactPeak =
    context.violenceLine.includes("Violence level 1")
      ? "peak display and survival pressure without contact"
      : "peak non-graphic action beat with the strongest survival pressure";

  return [
    {
      title: "Shot 1 Image - Establish / First-Frame Hook",
      stage: "Establish / first-frame hook",
      imageDirection: `${context.sceneGoal} Show ${context.primarySubjectLabel} and ${context.secondarySubjectLabel} clearly in the same 9:16 frame, full-body readable, with the main route or pressure lane visible.`,
      motionDirection: `Establish the scene with controlled documentary motion: ${context.relationshipLine}`,
    },
    {
      title: "Shot 2 Image - Pressure Build",
      stage: "Pressure build",
      imageDirection: `Increase pressure while preserving spacing logic. ${context.modeSpecificActionLine} Keep terrain, lighting, and subject identity locked.`,
      motionDirection: `Build pressure through one readable movement beat. ${context.modeSpecificActionLine}`,
    },
    {
      title: "Shot 3 Image - Peak Survival Beat",
      stage: "Peak non-graphic action",
      imageDirection: `Create the ${noContactPeak}. Keep stable anatomy, grounded contact, full-body readability, and no visible injury.`,
      motionDirection: `Peak movement beat: ${noContactPeak}. Preserve clean survival tension and avoid graphic outcome.`,
    },
    {
      title: "Shot 4 Image - Resolve / Unresolved Tension",
      stage: "Resolve / aftermath / unresolved tension",
      imageDirection: `${context.endingLine} Keep the final frame replay-worthy with both the environment and subject positions still readable.`,
      motionDirection: `Resolve into an aftermath or unresolved exit. ${context.endingLine}`,
    },
  ];
}

export function buildStoryModePromptContext(
  input: StoryModePromptContextInput
): StoryModePromptContext {
  const storyMode = safeStoryMode(input.storyMode);
  const modeLines = buildModeLines(input);
  const modeLabel = MODE_LABELS[storyMode] ?? titleCaseEnum(storyMode);
  const environmentLine = buildEnvironmentLine(input);
  const violenceLine = buildViolenceLine(input.violenceLevel);
  const endingLine = buildEndingLine(input.endingMode);
  const caption = [
    modeLines.facebookHookAngle,
    modeLines.relationshipLine,
    "What did you notice first?",
  ].join("\n");

  const baseContext = {
    storyMode,
    modeLabel,
    primarySubjectLabel: modeLines.subjectA,
    secondarySubjectLabel: modeLines.subjectB,
    groupLine: modeLines.groupLine,
    relationshipLine: modeLines.relationshipLine,
    sceneGoal: modeLines.sceneGoal,
    safetyLine: SAFETY_LINE,
    violenceLine,
    modeSpecificActionLine: modeLines.modeSpecificActionLine,
    endingLine,
    facebookHookAngle: modeLines.facebookHookAngle,
    caption,
    environmentLine,
  };

  return {
    ...baseContext,
    shotStages: buildShotStages(baseContext),
  };
}

function makeStructuredPrompt(
  fullText: string,
  engine: "image" | "runway" | "kling",
  title: string,
  variant: StructuredPromptMetadata["variant"] = "hybrid"
): StructuredPrompt {
  return {
    fullText,
    pasteReady: fullText,
    metadata: {
      engine,
      title,
      variant,
    },
  };
}

export function buildStoryModeImagePrompt(context: StoryModePromptContext) {
  return [
    `Nano Banana 2 primary master still for WSTV ${context.modeLabel}.`,
    "Photorealistic wildlife documentary master image, 9:16 vertical, video-ready source frame.",
    `Main subjects: ${context.primarySubjectLabel}; ${context.secondarySubjectLabel}.`,
    `Scene goal: ${context.sceneGoal}`,
    `Relationship: ${context.relationshipLine}`,
    context.groupLine,
    `Environment: ${context.environmentLine}`,
    context.modeSpecificActionLine,
    context.violenceLine,
    REALISM_LOCK,
    context.endingLine,
    context.safetyLine,
  ].filter(Boolean).join("\n");
}

export function buildStoryModeGptImage2Prompt(context: StoryModePromptContext) {
  return [
    `GPT Image 2 backup prompt for WSTV ${context.modeLabel}. Use the same scene logic if Nano Banana 2 output drifts or anatomy fails.`,
    buildStoryModeImagePrompt(context),
    "Keep the backup output natural-language, documentary realistic, anatomy-stable, and cover-safe for Facebook Reels.",
  ].join("\n\n");
}

export function buildStoryModeShotImagePlan(
  context: StoryModePromptContext
): ShotImagePlan[] {
  return context.shotStages.map((stage, index) => ({
    title: stage.title,
    source: index === 0 ? "master" : "previous_image",
    prompt: [
      index === 0
        ? "Base image: use the Nano Banana 2 primary master still as the Shot 1 visual-world anchor."
        : "Base image: use the previous continuity image from the same mode-specific sequence.",
      `Mode: ${context.modeLabel}.`,
      stage.imageDirection,
      `Continuity: preserve ${context.primarySubjectLabel} and ${context.secondarySubjectLabel} identities, habitat, lighting direction, scale, spacing logic, grounded contact, and full-body readability.`,
      context.violenceLine,
      context.safetyLine,
    ].join(" "),
  }));
}

export function buildStoryModeWorkflowPrompts(
  context: StoryModePromptContext,
  input: StoryModePromptContextInput
): StructuredPrompt[] {
  const engineSequence: Array<"runway" | "kling" | "kling" | "runway"> = [
    "runway",
    "kling",
    "kling",
    "runway",
  ];

  return context.shotStages.map((stage, index) => {
    const engine = engineSequence[index];
    const model =
      engine === "runway"
        ? cleanText(input.runwayModel, "Runway Gen-4.5")
        : cleanText(input.klingModel, "Kling 3.0 Pro");
    const prompt = [
      `Image-to-video from the generated ${context.modeLabel} shot image.`,
      `Engine: ${model}. Shot ${index + 1}: ${stage.stage}.`,
      "Preserve animal identities, habitat, lighting, scale, spacing, grounded contact, and first-frame composition.",
      stage.motionDirection,
      `Motion rule: describe only the movement needed for this shot; keep one clear action beat, no extra animals, no camera chaos.`,
      context.violenceLine,
      `${context.safetyLine} Clean Facebook Reels survival tension, no visible injury shown.`,
    ].join(" ");

    return makeStructuredPrompt(
      prompt,
      engine,
      `Story Mode ${index + 1} - ${stage.stage}`
    );
  });
}

export function buildStoryModePackageOverrides(
  input: StoryModePromptContextInput,
  basePkg: GeneratedPackage,
  shotLabels: Array<{
    durationLabel?: string;
    generationDurationLabel?: string;
    editTimelineLabel?: string;
    why?: string;
  }> = []
): Partial<GeneratedPackage> | null {
  if (!isNonPredatorStoryMode(input)) return null;

  const context = buildStoryModePromptContext(input);
  const imagePrompt = buildStoryModeImagePrompt(context);
  const gptImage2Prompt = buildStoryModeGptImage2Prompt(context);
  const shotImagePlan = buildStoryModeShotImagePlan(context);
  const workflowShots = buildStoryModeWorkflowPrompts(context, input);
  const workflowTexts = workflowShots.map((shot) => shot.fullText);
  const shotPlan = workflowShots.map((shot, index) => {
    const labels = shotLabels[index] ?? {};
    return {
      engine: index === 0 || index === 3 ? ("RUNWAY" as const) : ("KLING" as const),
      title: context.shotStages[index]?.stage ?? `Shot ${index + 1}`,
      prompt: shot.fullText,
      motionStrength: basePkg.motionStrength,
      durationLabel: labels.durationLabel,
      generationDurationLabel: labels.generationDurationLabel,
      editTimelineLabel: labels.editTimelineLabel,
      why:
        labels.why ??
        "Mode-aware story beat keeps the broader wildlife sequence readable.",
    };
  });
  const platformPack = basePkg.platformPack
    ? {
        ...basePkg.platformPack,
        facebook: {
          ...basePkg.platformPack.facebook,
          hook: context.facebookHookAngle,
          caption: context.caption,
        },
      }
    : basePkg.platformPack;

  return {
    imagePrompt,
    gptImage2Prompt,
    shotImagePlan,
    structuredPrompts: {
      ...basePkg.structuredPrompts,
      imagePrompt: makeStructuredPrompt(
        imagePrompt,
        "image",
        `Nano Banana 2 / Gemini ${context.modeLabel} master still`,
        "single-shot"
      ),
      gptImage2Prompt: makeStructuredPrompt(
        gptImage2Prompt,
        "image",
        `GPT Image 2 ${context.modeLabel} backup`,
        "single-shot"
      ),
      workflowShots,
    },
    shotPlan,
    hook: context.facebookHookAngle,
    caption: context.caption,
    platformPack,
    runwayBundle: [workflowTexts[0], workflowTexts[3]].filter(Boolean).join("\n\n---\n\n"),
    klingBundle: [workflowTexts[1], workflowTexts[2]].filter(Boolean).join("\n\n---\n\n"),
    predatorName: context.primarySubjectLabel,
    preyName: context.secondarySubjectLabel,
  };
}
