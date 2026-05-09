import { HabitatRegion, StoryMode, ViralLane } from "@/types";

import type {
  EscapeDirection,
  OffspringLabel,
  Season,
  StrikeMethod,
  Weather,
  WeatherHazard,
} from "@/types";

export const EASTERN_TIME_ZONE = "America/New_York";

export type SeasonalRealismStatus =
  | "strong"
  | "caution"
  | "mismatch"
  | "creative-override";

export type EasternCreatorContext = {
  timeZone: typeof EASTERN_TIME_ZONE;
  label: "US Eastern Time / ET";
  dateLabel: string;
  timeLabel: string;
  currentSeason: Exclude<Season, "MIGRATION_SEASON">;
};

export type SeasonalRealismAdviceInput = {
  storyMode: StoryMode;
  habitatRegion: HabitatRegion;
  season: Season;
  weather?: Weather;
  weatherHazard?: WeatherHazard;
  subjectA?: string;
  subjectB?: string;
  predator?: string;
  prey?: string;
  viralLane?: ViralLane;
  creativeOverride?: boolean;
};

export type SeasonalRealismAdvice = {
  status: SeasonalRealismStatus;
  statusLabel: string;
  recommendation: string;
  warnings: string[];
  passes: string[];
  suggestedSeason?: Season;
};

export type RecommendedSeasonalSetup = {
  storyMode: StoryMode;
  habitatRegion?: HabitatRegion;
  season?: Season;
  subjectA?: string;
  subjectB?: string;
  groupCount?: number;
  offspringLabel?: OffspringLabel;
  rutSeason?: boolean;
  strikeMethod?: StrikeMethod;
  escapeDirection?: EscapeDirection;
  weatherHazard?: WeatherHazard;
  foodItem?: string;
  label: string;
  reason: string;
};

const SEASON_LABELS: Record<Season, string> = {
  SPRING: "Spring",
  SUMMER: "Summer",
  FALL: "Fall",
  WINTER: "Winter",
  MIGRATION_SEASON: "Migration Season",
};

const HABITAT_LABELS: Record<HabitatRegion, string> = {
  [HabitatRegion.YELLOWSTONE]: "Yellowstone",
  [HabitatRegion.ALASKA]: "Alaska",
  [HabitatRegion.GREAT_PLAINS]: "Great Plains",
  [HabitatRegion.PACIFIC_NORTHWEST]: "Pacific Northwest",
  [HabitatRegion.EVERGLADES]: "Everglades",
  [HabitatRegion.ROCKY_MOUNTAINS]: "Rocky Mountains",
  [HabitatRegion.APPALACHIA]: "Appalachia",
  [HabitatRegion.SOUTHWEST_DESERT]: "Southwest Desert",
  [HabitatRegion.COASTAL_WETLANDS]: "Coastal Wetlands",
};

function getEasternMonth(date: Date) {
  const month = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN_TIME_ZONE,
    month: "numeric",
  }).format(date);

  return Number(month);
}

export function getNorthernHemisphereSeason(date: Date): Exclude<Season, "MIGRATION_SEASON"> {
  const month = date.getUTCMonth() + 1;

  if (month >= 3 && month <= 5) return "SPRING";
  if (month >= 6 && month <= 8) return "SUMMER";
  if (month >= 9 && month <= 11) return "FALL";
  return "WINTER";
}

function getSeasonFromMonth(month: number): Exclude<Season, "MIGRATION_SEASON"> {
  if (month >= 3 && month <= 5) return "SPRING";
  if (month >= 6 && month <= 8) return "SUMMER";
  if (month >= 9 && month <= 11) return "FALL";
  return "WINTER";
}

export function getEasternCreatorContext(date = new Date()): EasternCreatorContext {
  return {
    timeZone: EASTERN_TIME_ZONE,
    label: "US Eastern Time / ET",
    dateLabel: new Intl.DateTimeFormat("en-US", {
      timeZone: EASTERN_TIME_ZONE,
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date),
    timeLabel: new Intl.DateTimeFormat("en-US", {
      timeZone: EASTERN_TIME_ZONE,
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(date),
    currentSeason: getSeasonFromMonth(getEasternMonth(date)),
  };
}

function includesAny(value: string, words: string[]) {
  const text = value.toLowerCase();
  return words.some((word) => text.includes(word));
}

function getSubjectText(input: SeasonalRealismAdviceInput) {
  return [input.subjectA, input.subjectB, input.predator, input.prey]
    .filter(Boolean)
    .join(" ");
}

function baseRecommendation(input: SeasonalRealismAdviceInput) {
  const habitat = HABITAT_LABELS[input.habitatRegion] ?? input.habitatRegion;
  const season = SEASON_LABELS[input.season];

  if (input.habitatRegion === HabitatRegion.YELLOWSTONE && input.season === "FALL") {
    return "Strong Yellowstone fall lane: rut standoffs, bears feeding before winter, wolf pressure, and migration tension read naturally for U.S. wildlife viewers.";
  }

  if (input.habitatRegion === HabitatRegion.ALASKA && ["SUMMER", "FALL"].includes(input.season)) {
    return "Strong Alaska summer/fall lane: salmon runs, grizzly fishing, caribou movement, and river crossings feel seasonally grounded.";
  }

  if (input.season === "SPRING") {
    return "Spring works well for Mother & Baby, herd defense, calves/cubs, bear activity, elk/deer movement, and early migration pressure.";
  }

  if (input.season === "SUMMER") {
    return "Summer works well for Everglades alligator tension, grizzly fishing, bison herd pressure, and meadow scenes with visible movement.";
  }

  if (input.season === "WINTER") {
    return "Winter works well for bison snow survival, wolf pressure on elk or bison, moose in snow, caribou movement, and clean blizzard endurance.";
  }

  return `${habitat} ${season.toLowerCase()} is usable when the subjects, weather, and story mode support the selected habitat.`;
}

export function getRecommendedWildlifeSetup(input: SeasonalRealismAdviceInput) {
  if (input.habitatRegion === HabitatRegion.YELLOWSTONE && input.season === "SPRING") {
    return "Good fits: Mother & Baby with grizzly mother/cub, or Herd Defense with bison herd and wolf pack.";
  }

  if (input.habitatRegion === HabitatRegion.YELLOWSTONE && input.season === "FALL") {
    return "Good fits: Rival Clash with bull elk, Predator vs Prey with wolf pack and elk, or bear feeding tension before winter.";
  }

  if (input.habitatRegion === HabitatRegion.EVERGLADES && input.season === "SUMMER") {
    return "Good fits: alligator tension near water, wild boar or deer escape lanes, or fishing strike action with clean waterline motion.";
  }

  if (input.habitatRegion === HabitatRegion.ALASKA && ["SUMMER", "FALL"].includes(input.season)) {
    return "Good fits: Grizzly Bear vs Sockeye Salmon, Fishing Strike, or Caribou Herd river crossing.";
  }

  return "Use the selected story mode with habitat-specific wildlife, clean spacing, and non-graphic survival pressure.";
}


function buildSetup({
  storyMode,
  habitatRegion,
  season,
  subjectA,
  subjectB,
  groupCount,
  offspringLabel,
  rutSeason,
  strikeMethod,
  escapeDirection,
  weatherHazard,
  foodItem,
  label,
  reason,
}: RecommendedSeasonalSetup): RecommendedSeasonalSetup {
  return {
    storyMode,
    ...(habitatRegion ? { habitatRegion } : {}),
    ...(season ? { season } : {}),
    ...(subjectA ? { subjectA } : {}),
    ...(subjectB ? { subjectB } : {}),
    ...(groupCount !== undefined ? { groupCount } : {}),
    ...(offspringLabel ? { offspringLabel } : {}),
    ...(rutSeason !== undefined ? { rutSeason } : {}),
    ...(strikeMethod ? { strikeMethod } : {}),
    ...(escapeDirection ? { escapeDirection } : {}),
    ...(weatherHazard ? { weatherHazard } : {}),
    ...(foodItem ? { foodItem } : {}),
    label,
    reason,
  };
}

export function getRecommendedSeasonalSetup(
  input: SeasonalRealismAdviceInput
): RecommendedSeasonalSetup | null {
  const isFallOrWinter = ["FALL", "WINTER"].includes(input.season);
  const isSummerOrFall = ["SUMMER", "FALL"].includes(input.season);
  const isSpringOrEarlySummer = ["SPRING", "SUMMER"].includes(input.season);

  if (input.habitatRegion === HabitatRegion.YELLOWSTONE && input.season === "FALL") {
    return buildSetup({
      storyMode: StoryMode.RIVAL_CLASH,
      habitatRegion: HabitatRegion.YELLOWSTONE,
      season: "FALL",
      subjectA: "Bull Elk A",
      subjectB: "Bull Elk B",
      rutSeason: true,
      label: "Yellowstone Fall Rival Clash",
      reason: "Bull elk rut standoffs are a strong fall Yellowstone setup for U.S. wildlife viewers.",
    });
  }

  if (input.habitatRegion === HabitatRegion.YELLOWSTONE && input.season === "SPRING") {
    return buildSetup({
      storyMode: StoryMode.MOTHER_BABY,
      habitatRegion: HabitatRegion.YELLOWSTONE,
      season: "SPRING",
      subjectA: "Grizzly Mother",
      subjectB: "Male Grizzly",
      offspringLabel: "cub",
      label: "Yellowstone Spring Mother & Baby",
      reason: "Spring supports protective mother-and-cub tension without needing graphic conflict.",
    });
  }

  if (input.habitatRegion === HabitatRegion.YELLOWSTONE && input.season === "WINTER") {
    return buildSetup({
      storyMode: StoryMode.WEATHER_SURVIVAL,
      habitatRegion: HabitatRegion.YELLOWSTONE,
      season: "WINTER",
      subjectA: "American Bison",
      subjectB: "Blizzard Wind",
      groupCount: 8,
      weatherHazard: "BLIZZARD",
      label: "Yellowstone Winter Weather Survival",
      reason: "Bison moving through blizzard pressure is a realistic winter survival lane.",
    });
  }

  if (input.habitatRegion === HabitatRegion.EVERGLADES && input.season === "SUMMER") {
    return buildSetup({
      storyMode: StoryMode.PREDATOR_VS_PREY,
      habitatRegion: HabitatRegion.EVERGLADES,
      season: "SUMMER",
      subjectA: "Alligator",
      subjectB: "Wild Boar",
      label: "Everglades Summer Alligator Tension",
      reason: "Summer Everglades waterline tension works well with alligator pressure and a clear escape lane.",
    });
  }

  if (input.habitatRegion === HabitatRegion.ALASKA && isSummerOrFall) {
    return buildSetup({
      storyMode: StoryMode.FISHING_STRIKE,
      habitatRegion: HabitatRegion.ALASKA,
      season: input.season,
      subjectA: "Grizzly Bear",
      subjectB: "Sockeye Salmon",
      strikeMethod: "SWIPE",
      label: "Alaska Salmon Fishing Strike",
      reason: "Alaska summer/fall salmon runs make a clean, readable fishing-strike setup.",
    });
  }

  if (input.habitatRegion === HabitatRegion.GREAT_PLAINS && isSummerOrFall) {
    return buildSetup({
      storyMode: StoryMode.HERD_DEFENSE,
      habitatRegion: HabitatRegion.GREAT_PLAINS,
      season: input.season,
      subjectA: "Bison Herd",
      subjectB: "Wolf Pack",
      groupCount: 12,
      label: "Great Plains Bison Herd Defense",
      reason: "Bison herd formation against outside pressure is readable and regionally grounded.",
    });
  }

  if (input.habitatRegion === HabitatRegion.ROCKY_MOUNTAINS && isFallOrWinter) {
    return buildSetup({
      storyMode: StoryMode.RIVAL_CLASH,
      habitatRegion: HabitatRegion.ROCKY_MOUNTAINS,
      season: input.season,
      subjectA: "Bull Elk A",
      subjectB: "Bull Elk B",
      rutSeason: input.season === "FALL",
      label: "Rocky Mountains Elk Standoff",
      reason: "Elk dominance tension fits Rocky Mountain fall/winter wildlife storytelling.",
    });
  }

  if (input.habitatRegion === HabitatRegion.PACIFIC_NORTHWEST && isSpringOrEarlySummer) {
    return buildSetup({
      storyMode: StoryMode.MOTHER_BABY,
      habitatRegion: HabitatRegion.PACIFIC_NORTHWEST,
      season: input.season,
      subjectA: "Black Bear Mother",
      subjectB: "Coyote",
      offspringLabel: "cub",
      label: "Pacific Northwest Protective Bear Family",
      reason: "Spring and early summer support protective family tension in forest habitat.",
    });
  }

  return null;
}

export function getSeasonalRealismAdvice(
  input: SeasonalRealismAdviceInput
): SeasonalRealismAdvice {
  if (input.creativeOverride) {
    return {
      status: "creative-override",
      statusLabel: "Creative override",
      recommendation:
        "Creative override is on for this session. Selected Season still controls prompt output; review realism before publishing.",
      warnings: [],
      passes: ["Manual creative override acknowledged."],
    };
  }

  const warnings: string[] = [];
  const passes: string[] = [];
  const subjectText = getSubjectText(input);
  const weatherText = `${input.weather ?? ""} ${input.weatherHazard ?? ""}`;
  const winterWeather = includesAny(weatherText, ["blizzard", "snow", "frozen", "ice"]);
  const alligatorSubject = includesAny(subjectText, ["alligator"]);
  const salmonSubject = includesAny(subjectText, ["salmon"]);

  if (input.season === "SUMMER" && input.weatherHazard === "BLIZZARD") {
    warnings.push("Summer plus Blizzard reads as a seasonal mismatch unless this is a clear creative override.");
  }

  if (input.habitatRegion === HabitatRegion.EVERGLADES && winterWeather) {
    warnings.push("Everglades with deep snow, ice, or blizzard weather may feel unrealistic for U.S. wildlife viewers.");
  }

  if (alligatorSubject && (input.season === "WINTER" || winterWeather)) {
    warnings.push("Alligator action in heavy winter or snow conditions can feel geographically and seasonally unrealistic.");
  }

  if (
    input.season === "WINTER" &&
    salmonSubject &&
    input.habitatRegion !== HabitatRegion.ALASKA &&
    input.storyMode === StoryMode.FISHING_STRIKE
  ) {
    warnings.push("Winter salmon splash scenes work best in Alaska/fall context; elsewhere they may read like a summer setup.");
  }

  if (
    input.habitatRegion === HabitatRegion.YELLOWSTONE &&
    input.season === "FALL" &&
    input.storyMode === StoryMode.RIVAL_CLASH
  ) {
    passes.push("Yellowstone fall and Rival Clash align strongly with elk rut / dominance tension.");
  }

  if (
    input.habitatRegion === HabitatRegion.ALASKA &&
    ["SUMMER", "FALL"].includes(input.season) &&
    input.storyMode === StoryMode.FISHING_STRIKE &&
    salmonSubject
  ) {
    passes.push("Alaska summer/fall salmon run and Fishing Strike are a strong seasonal wildlife match.");
  }

  if (
    input.season === "SPRING" &&
    [StoryMode.MOTHER_BABY, StoryMode.HERD_DEFENSE, StoryMode.MIGRATION].includes(input.storyMode)
  ) {
    passes.push("Spring supports family protection, herd movement, and early migration pressure.");
  }

  if (warnings.length > 0) {
    return {
      status: "mismatch",
      statusLabel: "Seasonal mismatch",
      recommendation:
        "This can work as a creative override, but it may feel less realistic for U.S. wildlife viewers.",
      warnings,
      passes,
      suggestedSeason: winterWeather ? "WINTER" : input.habitatRegion === HabitatRegion.EVERGLADES ? "SUMMER" : undefined,
    };
  }

  if (passes.length > 0) {
    return {
      status: "strong",
      statusLabel: "Strong seasonal match",
      recommendation: baseRecommendation(input),
      warnings,
      passes,
    };
  }

  if (input.season === "MIGRATION_SEASON") {
    return {
      status: "caution",
      statusLabel: "Usable with caution",
      recommendation:
        "Migration Season is usable when the obstacle, route, herd scale, and habitat are clearly visible.",
      warnings: [],
      passes: ["Migration framing can work when route readability is strong."],
    };
  }

  return {
    status: "caution",
    statusLabel: "Usable with caution",
    recommendation: `${baseRecommendation(input)} ${getRecommendedWildlifeSetup(input)}`,
    warnings: [],
    passes: ["No critical seasonal mismatch detected."],
  };
}
