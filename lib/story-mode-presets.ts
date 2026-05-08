import {
  EncounterMode,
  EndingMode,
  HabitatRegion,
  StoryMode,
  ViralLane,
  ViolenceLevel,
} from "@/types";

import type {
  EscapeDirection,
  OffspringLabel,
  Season,
  StrikeMethod,
  TimeOfDay,
  WeatherHazard,
} from "@/types";

export type StoryModePreset = {
  id: string;
  name: string;
  storyMode: Exclude<StoryMode, StoryMode.PREDATOR_VS_PREY>;
  summary: string;
  subjectA: string;
  subjectB: string;
  groupCount?: number;
  offspringLabel?: OffspringLabel;
  strikeMethod?: StrikeMethod;
  escapeDirection?: EscapeDirection;
  weatherHazard?: WeatherHazard;
  rutSeason?: boolean;
  foodItem?: string;
  habitatRegion: HabitatRegion;
  season: Season;
  timeOfDay: TimeOfDay;
  encounterMode: EncounterMode;
  endingMode: EndingMode;
  viralLane: ViralLane;
  violenceLevel: ViolenceLevel;
  sceneDescription: string;
};

export const NON_PREDATOR_STORY_MODES: Array<
  Exclude<StoryMode, StoryMode.PREDATOR_VS_PREY>
> = [
  StoryMode.HERD_DEFENSE,
  StoryMode.MOTHER_BABY,
  StoryMode.RIVAL_CLASH,
  StoryMode.NEAR_MISS,
  StoryMode.FISHING_STRIKE,
  StoryMode.WEATHER_SURVIVAL,
  StoryMode.MIGRATION,
  StoryMode.SCAVENGER_CONFLICT,
];

export const STORY_MODE_PRESET_LABELS: Record<StoryMode, string> = {
  [StoryMode.PREDATOR_VS_PREY]: "Predator vs Prey",
  [StoryMode.HERD_DEFENSE]: "Herd Defense",
  [StoryMode.MOTHER_BABY]: "Mother & Baby",
  [StoryMode.RIVAL_CLASH]: "Rival Clash",
  [StoryMode.NEAR_MISS]: "Near-Miss Escape",
  [StoryMode.FISHING_STRIKE]: "Fishing Strike",
  [StoryMode.WEATHER_SURVIVAL]: "Weather Survival",
  [StoryMode.MIGRATION]: "Migration Crossing",
  [StoryMode.SCAVENGER_CONFLICT]: "Scavenger Conflict",
};

export const USA_STORY_MODE_PRESETS: StoryModePreset[] = [
  {
    id: "bison-herd-wall-vs-wolves",
    name: "Bison Herd Wall vs Wolves",
    storyMode: StoryMode.HERD_DEFENSE,
    summary: "Great Plains herd forms a readable defensive wall.",
    subjectA: "Bison Herd",
    subjectB: "Wolf Pack",
    groupCount: 18,
    habitatRegion: HabitatRegion.GREAT_PLAINS,
    season: "FALL",
    timeOfDay: "GOLDEN_HOUR",
    encounterMode: EncounterMode.PEAK_TENSION,
    endingMode: EndingMode.STANDOFF,
    viralLane: ViralLane.POWER,
    violenceLevel: ViolenceLevel.DISPLAY_ONLY,
    sceneDescription:
      "A bison herd closes into a defensive wall while a wolf pack pressures the outer edge across an open Great Plains lane.",
  },
  {
    id: "musk-ox-circle-defense",
    name: "Musk Ox Circle Defense",
    storyMode: StoryMode.HERD_DEFENSE,
    summary: "Arctic herd circle holds its ground in wind.",
    subjectA: "Musk Ox Herd",
    subjectB: "Arctic Wolf Pack",
    groupCount: 14,
    habitatRegion: HabitatRegion.ALASKA,
    season: "WINTER",
    timeOfDay: "DUSK",
    encounterMode: EncounterMode.ESCALATION,
    endingMode: EndingMode.STANDOFF,
    viralLane: ViralLane.SURVIVAL,
    violenceLevel: ViolenceLevel.DISPLAY_ONLY,
    sceneDescription:
      "A musk ox herd tightens into a circle on snowy tundra while arctic wolves test the outside spacing without contact.",
  },
  {
    id: "yellowstone-grizzly-mother-protects-cubs",
    name: "Yellowstone Grizzly Mother Protects Cubs",
    storyMode: StoryMode.MOTHER_BABY,
    summary: "Protective mother blocks a distant male grizzly.",
    subjectA: "Grizzly Mother",
    subjectB: "Male Grizzly",
    offspringLabel: "cub",
    habitatRegion: HabitatRegion.YELLOWSTONE,
    season: "FALL",
    timeOfDay: "GOLDEN_HOUR",
    encounterMode: EncounterMode.FIRST_CONTACT,
    endingMode: EndingMode.PROTECTED_EXIT,
    viralLane: ViralLane.TENDERNESS,
    violenceLevel: ViolenceLevel.DISPLAY_ONLY,
    sceneDescription:
      "A grizzly mother keeps two cubs close near the Yellowstone treeline as a male grizzly appears at distance.",
  },
  {
    id: "moose-cow-shields-calf",
    name: "Moose Cow Shields Calf",
    storyMode: StoryMode.MOTHER_BABY,
    summary: "Cow moose creates a protective lane for a calf.",
    subjectA: "Moose Cow",
    subjectB: "Wolf Pack",
    offspringLabel: "calf",
    habitatRegion: HabitatRegion.ROCKY_MOUNTAINS,
    season: "SPRING",
    timeOfDay: "DAWN",
    encounterMode: EncounterMode.PEAK_TENSION,
    endingMode: EndingMode.PROTECTED_EXIT,
    viralLane: ViralLane.SURVIVAL,
    violenceLevel: ViolenceLevel.DISPLAY_ONLY,
    sceneDescription:
      "A moose cow shields her calf at a wet meadow edge while wolves remain outside the open escape lane.",
  },
  {
    id: "bull-elk-rut-standoff",
    name: "Bull Elk Rut Standoff",
    storyMode: StoryMode.RIVAL_CLASH,
    summary: "Rut-season display with antlers lowered and no injury.",
    subjectA: "Bull Elk A",
    subjectB: "Bull Elk B",
    rutSeason: true,
    habitatRegion: HabitatRegion.YELLOWSTONE,
    season: "FALL",
    timeOfDay: "GOLDEN_HOUR",
    encounterMode: EncounterMode.ESCALATION,
    endingMode: EndingMode.STANDOFF,
    viralLane: ViralLane.POWER,
    violenceLevel: ViolenceLevel.IMPLIED_PRESSURE,
    sceneDescription:
      "Two bull elk square off in a Yellowstone meadow during rut season, antlers lowered, spacing tight but non-graphic.",
  },
  {
    id: "bison-bulls-dominance-clash",
    name: "Bison Bulls Dominance Clash",
    storyMode: StoryMode.RIVAL_CLASH,
    summary: "Heavy-body dominance pressure across prairie dust.",
    subjectA: "Bison Bull A",
    subjectB: "Bison Bull B",
    rutSeason: true,
    habitatRegion: HabitatRegion.GREAT_PLAINS,
    season: "SUMMER",
    timeOfDay: "DUSK",
    encounterMode: EncounterMode.PEAK_TENSION,
    endingMode: EndingMode.DOMINANT_WIN,
    viralLane: ViralLane.POWER,
    violenceLevel: ViolenceLevel.IMPLIED_PRESSURE,
    sceneDescription:
      "Two bison bulls hold a dominance line on open prairie, shoulder mass readable, grounded stance, no injury shown.",
  },
  {
    id: "deer-last-second-brush-escape",
    name: "Deer Last-Second Brush Escape",
    storyMode: StoryMode.NEAR_MISS,
    summary: "White-tailed deer cuts into brush before contact.",
    subjectA: "White-tailed Deer",
    subjectB: "Mountain Lion",
    escapeDirection: "BRUSH",
    habitatRegion: HabitatRegion.APPALACHIA,
    season: "FALL",
    timeOfDay: "GOLDEN_HOUR",
    encounterMode: EncounterMode.PEAK_TENSION,
    endingMode: EndingMode.ESCAPE,
    viralLane: ViralLane.UNDERDOG,
    violenceLevel: ViolenceLevel.DISPLAY_ONLY,
    sceneDescription:
      "A white-tailed deer makes a last-second cut into brush as a mountain lion closes the gap along a forest edge.",
  },
  {
    id: "rabbit-fox-near-miss",
    name: "Rabbit Fox Near-Miss",
    storyMode: StoryMode.NEAR_MISS,
    summary: "Small-animal escape reads fast and clean.",
    subjectA: "Snowshoe Hare",
    subjectB: "Red Fox",
    escapeDirection: "UPHILL",
    habitatRegion: HabitatRegion.PACIFIC_NORTHWEST,
    season: "WINTER",
    timeOfDay: "DAWN",
    encounterMode: EncounterMode.ESCALATION,
    endingMode: EndingMode.ESCAPE,
    viralLane: ViralLane.UNDERDOG,
    violenceLevel: ViolenceLevel.DISPLAY_ONLY,
    sceneDescription:
      "A snowshoe hare turns uphill through snowy brush as a red fox misses the line by a narrow clean gap.",
  },
  {
    id: "grizzly-salmon-swipe",
    name: "Grizzly Salmon Swipe",
    storyMode: StoryMode.FISHING_STRIKE,
    summary: "Waterline feeding strike with readable splash.",
    subjectA: "Grizzly Bear",
    subjectB: "Sockeye Salmon",
    strikeMethod: "SWIPE",
    habitatRegion: HabitatRegion.ALASKA,
    season: "SUMMER",
    timeOfDay: "GOLDEN_HOUR",
    encounterMode: EncounterMode.PEAK_TENSION,
    endingMode: EndingMode.UNRESOLVED,
    viralLane: ViralLane.SPECTACLE,
    violenceLevel: ViolenceLevel.IMPLIED_PRESSURE,
    sceneDescription:
      "A grizzly bear swipes toward sockeye salmon in a shallow Alaskan river, splash readable and non-graphic.",
  },
  {
    id: "bald-eagle-river-strike",
    name: "Bald Eagle River Strike",
    storyMode: StoryMode.FISHING_STRIKE,
    summary: "Eagle dive over a cold river lane.",
    subjectA: "Bald Eagle",
    subjectB: "Trout",
    strikeMethod: "DIVE",
    habitatRegion: HabitatRegion.ROCKY_MOUNTAINS,
    season: "SPRING",
    timeOfDay: "DAWN",
    encounterMode: EncounterMode.FIRST_CONTACT,
    endingMode: EndingMode.UNRESOLVED,
    viralLane: ViralLane.AWE,
    violenceLevel: ViolenceLevel.DISPLAY_ONLY,
    sceneDescription:
      "A bald eagle drops toward a trout line over a cold Rocky Mountain river, wings clear, water surface readable.",
  },
  {
    id: "bison-blizzard-push",
    name: "Bison Blizzard Push",
    storyMode: StoryMode.WEATHER_SURVIVAL,
    summary: "Weather becomes the antagonist on open plains.",
    subjectA: "American Bison",
    subjectB: "Blizzard",
    groupCount: 8,
    weatherHazard: "BLIZZARD",
    habitatRegion: HabitatRegion.YELLOWSTONE,
    season: "WINTER",
    timeOfDay: "BLUE_HOUR",
    encounterMode: EncounterMode.ESCALATION,
    endingMode: EndingMode.SEASONAL_DEPARTURE,
    viralLane: ViralLane.SURVIVAL,
    violenceLevel: ViolenceLevel.DISPLAY_ONLY,
    sceneDescription:
      "American bison push through blizzard wind across a Yellowstone plain, snow pressure visible, no animal conflict needed.",
  },
  {
    id: "moose-frozen-river-crossing",
    name: "Moose Frozen River Crossing",
    storyMode: StoryMode.WEATHER_SURVIVAL,
    summary: "Moose tests ice and moving water with care.",
    subjectA: "Bull Moose",
    subjectB: "Frozen River",
    groupCount: 1,
    weatherHazard: "ICE",
    habitatRegion: HabitatRegion.ALASKA,
    season: "WINTER",
    timeOfDay: "DUSK",
    encounterMode: EncounterMode.PEAK_TENSION,
    endingMode: EndingMode.UNRESOLVED,
    viralLane: ViralLane.TENSION,
    violenceLevel: ViolenceLevel.DISPLAY_ONLY,
    sceneDescription:
      "A bull moose carefully steps through a frozen river crossing, ice texture and waterline tension readable.",
  },
  {
    id: "caribou-river-crossing",
    name: "Caribou River Crossing",
    storyMode: StoryMode.MIGRATION,
    summary: "Large migration route approaches shallow water.",
    subjectA: "Caribou Herd",
    subjectB: "River Crossing",
    groupCount: 250,
    habitatRegion: HabitatRegion.ALASKA,
    season: "MIGRATION_SEASON",
    timeOfDay: "GOLDEN_HOUR",
    encounterMode: EncounterMode.FIRST_CONTACT,
    endingMode: EndingMode.SEASONAL_DEPARTURE,
    viralLane: ViralLane.AWE,
    violenceLevel: ViolenceLevel.DISPLAY_ONLY,
    sceneDescription:
      "A caribou herd approaches a shallow river crossing, lead animals hesitating as the migration line compresses behind them.",
  },
  {
    id: "elk-meadow-migration-lane",
    name: "Elk Meadow Migration Lane",
    storyMode: StoryMode.MIGRATION,
    summary: "Elk herd funnels through a mountain meadow route.",
    subjectA: "Elk Herd",
    subjectB: "Mountain Meadow Lane",
    groupCount: 80,
    habitatRegion: HabitatRegion.ROCKY_MOUNTAINS,
    season: "FALL",
    timeOfDay: "DAWN",
    encounterMode: EncounterMode.PEAK_TENSION,
    endingMode: EndingMode.SEASONAL_DEPARTURE,
    viralLane: ViralLane.SPECTACLE,
    violenceLevel: ViolenceLevel.DISPLAY_ONLY,
    sceneDescription:
      "An elk herd funnels through a mountain meadow lane, route pressure rising as lead animals choose the safe path.",
  },
  {
    id: "bald-eagle-vs-coyote-food-zone",
    name: "Bald Eagle vs Coyote Food Zone",
    storyMode: StoryMode.SCAVENGER_CONFLICT,
    summary: "Ownership tension around a non-graphic food zone.",
    subjectA: "Bald Eagle",
    subjectB: "Coyote",
    foodItem: "non-graphic deer carcass zone",
    habitatRegion: HabitatRegion.GREAT_PLAINS,
    season: "WINTER",
    timeOfDay: "GOLDEN_HOUR",
    encounterMode: EncounterMode.PEAK_TENSION,
    endingMode: EndingMode.STANDOFF,
    viralLane: ViralLane.TENSION,
    violenceLevel: ViolenceLevel.DISPLAY_ONLY,
    sceneDescription:
      "A bald eagle guards a partially obscured non-graphic food zone while a coyote circles outside the claim line.",
  },
  {
    id: "wolf-vs-bear-non-graphic-food-claim",
    name: "Wolf vs Bear Non-Graphic Food Claim",
    storyMode: StoryMode.SCAVENGER_CONFLICT,
    summary: "Bear pressure changes the claim line without graphic detail.",
    subjectA: "Gray Wolf",
    subjectB: "Black Bear",
    foodItem: "covered food claim zone",
    habitatRegion: HabitatRegion.PACIFIC_NORTHWEST,
    season: "FALL",
    timeOfDay: "DUSK",
    encounterMode: EncounterMode.ESCALATION,
    endingMode: EndingMode.UNRESOLVED,
    viralLane: ViralLane.POWER,
    violenceLevel: ViolenceLevel.DISPLAY_ONLY,
    sceneDescription:
      "A gray wolf holds a covered food claim zone while a black bear steps into the forest-edge spacing, no graphic feeding shown.",
  },
];

export function getStoryModePresetsForMode(storyMode: StoryMode) {
  return USA_STORY_MODE_PRESETS.filter(
    (preset) => preset.storyMode === storyMode
  );
}

export function formatStoryModePresetLabel(value: string | number) {
  return String(value)
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
