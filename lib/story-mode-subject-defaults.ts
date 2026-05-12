import { StoryMode } from "@/types";

import type {
  EscapeDirection,
  OffspringLabel,
  StrikeMethod,
  WeatherHazard,
} from "@/types";

export type StoryModeSubjectValues = {
  subjectA?: string;
  subjectB?: string;
  groupCount?: number;
  offspringLabel?: OffspringLabel;
  strikeMethod?: StrikeMethod;
  escapeDirection?: EscapeDirection;
  weatherHazard?: WeatherHazard;
  rutSeason?: boolean;
  foodItem?: string;
};

export function getStoryModeSubjectDefaults(
  storyMode: StoryMode,
  predator = "Mountain Lion",
  prey = "White-tailed Deer"
): StoryModeSubjectValues {
  switch (storyMode) {
    case StoryMode.HERD_DEFENSE:
      return { subjectA: "Bison Herd", subjectB: "Wolf Pack", groupCount: 12 };
    case StoryMode.MOTHER_BABY:
      return {
        subjectA: "Grizzly Mother",
        subjectB: "Male Grizzly",
        offspringLabel: "cub",
      };
    case StoryMode.RIVAL_CLASH:
      return { subjectA: "Bull Elk A", subjectB: "Bull Elk B", rutSeason: true };
    case StoryMode.NEAR_MISS:
      return {
        subjectA: "White-tailed Deer",
        subjectB: "Mountain Lion",
        escapeDirection: "BRUSH",
      };
    case StoryMode.FISHING_STRIKE:
      return {
        subjectA: "Bald Eagle",
        subjectB: "Trout",
        strikeMethod: "DIVE",
      };
    case StoryMode.WEATHER_SURVIVAL:
      return {
        subjectA: "American Bison",
        subjectB: "Blizzard Wind",
        weatherHazard: "BLIZZARD",
        groupCount: 8,
      };
    case StoryMode.MIGRATION:
      return {
        subjectA: "Elk Herd",
        subjectB: "Mountain Meadow Lane",
        groupCount: 80,
      };
    case StoryMode.SCAVENGER_CONFLICT:
      return {
        subjectA: "Bald Eagle",
        subjectB: "Coyote",
        foodItem: "non-graphic deer food claim zone",
      };
    case StoryMode.PREDATOR_VS_PREY:
    default:
      return { subjectA: predator, subjectB: prey };
  }
}

export type StoryModeSubjectOverrideFlags = {
  subjectA: boolean;
  subjectB: boolean;
  groupCount: boolean;
  offspringLabel: boolean;
  strikeMethod: boolean;
  escapeDirection: boolean;
  weatherHazard: boolean;
  rutSeason: boolean;
  foodItem: boolean;
};

function textHasOverride(value: string | undefined, defaultValue: string | undefined) {
  const text = value?.trim();
  return Boolean(text && text !== (defaultValue ?? ""));
}

export function getStoryModeSubjectOverrideFlags(
  storyMode: StoryMode,
  values: StoryModeSubjectValues
): StoryModeSubjectOverrideFlags {
  const defaults = getStoryModeSubjectDefaults(storyMode);

  return {
    subjectA: textHasOverride(values.subjectA, defaults.subjectA),
    subjectB: textHasOverride(values.subjectB, defaults.subjectB),
    groupCount:
      values.groupCount !== undefined &&
      defaults.groupCount !== undefined &&
      values.groupCount !== defaults.groupCount,
    offspringLabel:
      storyMode === StoryMode.MOTHER_BABY &&
      values.offspringLabel !== undefined &&
      values.offspringLabel !== (defaults.offspringLabel ?? "cub"),
    strikeMethod:
      storyMode === StoryMode.FISHING_STRIKE &&
      values.strikeMethod !== undefined &&
      values.strikeMethod !== (defaults.strikeMethod ?? "SWIPE"),
    escapeDirection:
      storyMode === StoryMode.NEAR_MISS &&
      values.escapeDirection !== undefined &&
      values.escapeDirection !== (defaults.escapeDirection ?? "BRUSH"),
    weatherHazard:
      storyMode === StoryMode.WEATHER_SURVIVAL &&
      values.weatherHazard !== undefined &&
      values.weatherHazard !== (defaults.weatherHazard ?? "BLIZZARD"),
    rutSeason:
      storyMode === StoryMode.RIVAL_CLASH &&
      values.rutSeason !== undefined &&
      values.rutSeason !== (defaults.rutSeason ?? false),
    foodItem:
      storyMode === StoryMode.SCAVENGER_CONFLICT &&
      textHasOverride(values.foodItem, defaults.foodItem),
  };
}

export function hasStoryModeSubjectOverride(
  storyMode: StoryMode,
  values: StoryModeSubjectValues
) {
  return Object.values(getStoryModeSubjectOverrideFlags(storyMode, values)).some(
    Boolean
  );
}
