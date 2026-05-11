import { StoryMode } from "@/types";

import {
  getPairedSubjectAOptions,
  getPairedSubjectBOptions,
} from "@/lib/story-mode-animal-pairings";
import { USA_STORY_MODE_PRESETS } from "@/lib/story-mode-presets";
import { getStoryModeSubjectDefaults } from "@/lib/story-mode-subject-defaults";

type SubjectOptionField = "subjectA" | "subjectB";

const USA_VIRAL_ANIMAL_PRIORITY = [
  "Bald Eagle",
  "Coyote",
  "Bison",
  "American Bison",
  "Wolf Pack",
  "Grizzly Bear",
  "Grizzly Mother",
  "Male Grizzly",
  "Black Bear",
  "Mountain Lion",
  "White-tailed Deer",
  "Bull Elk",
  "Bull Elk A",
  "Bull Elk B",
  "Elk Herd",
  "Moose",
  "Caribou Herd",
  "Trout",
  "Sockeye Salmon",
];

const FISHING_FOOD_SOURCE_PRIORITY = [
  "Trout",
  "Sockeye Salmon",
  "Salmon",
  "Fish",
];

const MODE_SUBJECT_PRIORITY: Partial<
  Record<StoryMode, Partial<Record<SubjectOptionField, string[]>>>
> = {
  [StoryMode.HERD_DEFENSE]: {
    subjectA: ["Bison Herd", "American Bison", "Bison"],
    subjectB: ["Wolf Pack", "Coyote"],
  },
  [StoryMode.MOTHER_BABY]: {
    subjectA: ["Grizzly Mother", "Grizzly Bear", "Black Bear", "Moose Cow"],
    subjectB: ["Male Grizzly", "Wolf Pack", "Black Bear", "Coyote"],
  },
  [StoryMode.RIVAL_CLASH]: {
    subjectA: ["Bull Elk A", "Bull Elk", "Bison Bull A"],
    subjectB: ["Bull Elk B", "Bull Elk", "Bison Bull B"],
  },
  [StoryMode.NEAR_MISS]: {
    subjectA: ["White-tailed Deer", "Elk", "Moose", "Snowshoe Hare"],
    subjectB: ["Mountain Lion", "Coyote", "Wolf Pack", "Red Fox"],
  },
  [StoryMode.FISHING_STRIKE]: {
    subjectA: ["Bald Eagle", "Grizzly Bear", "Black Bear"],
  },
  [StoryMode.WEATHER_SURVIVAL]: {
    subjectA: ["American Bison", "Bison", "Elk Herd", "Moose", "Caribou Herd"],
  },
  [StoryMode.MIGRATION]: {
    subjectA: ["Elk Herd", "Caribou Herd", "Bison Herd", "Moose"],
  },
  [StoryMode.SCAVENGER_CONFLICT]: {
    subjectA: ["Bald Eagle", "Coyote", "Wolf Pack", "Black Bear"],
    subjectB: ["Coyote", "Black Bear", "Wolf Pack", "Bald Eagle"],
  },
};

function normalizeOption(value: string) {
  return value.trim().toLowerCase();
}

function uniqueOptions(options: Array<string | undefined>) {
  const seen = new Set<string>();

  return options.filter((option): option is string => {
    const normalized = normalizeOption(option ?? "");
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function getPresetSubjects(storyMode: StoryMode, field: SubjectOptionField) {
  return USA_STORY_MODE_PRESETS.filter(
    (preset) => preset.storyMode === storyMode
  ).map((preset) => preset[field]);
}

export function getStoryModeAnimalOptions({
  storyMode,
  field,
  animalOptions,
  currentValue,
  subjectA,
  subjectB,
}: {
  storyMode: StoryMode;
  field: SubjectOptionField;
  animalOptions: string[];
  currentValue?: string;
  subjectA?: string;
  subjectB?: string;
}) {
  const defaults = getStoryModeSubjectDefaults(storyMode);
  const pairedOptions =
    field === "subjectB"
      ? getPairedSubjectBOptions({
          storyMode,
          subjectA,
          animalOptions,
        })
      : getPairedSubjectAOptions({
          storyMode,
          subjectB,
          animalOptions,
        });

  return uniqueOptions([
    currentValue,
    ...pairedOptions,
    ...(MODE_SUBJECT_PRIORITY[storyMode]?.[field] ?? []),
    defaults[field],
    ...getPresetSubjects(storyMode, field),
    ...USA_VIRAL_ANIMAL_PRIORITY,
    ...animalOptions,
  ]);
}

export function getFishingFoodSourceOptions({
  animalOptions,
  currentValue,
  subjectA,
}: {
  animalOptions: string[];
  currentValue?: string;
  subjectA?: string;
}) {
  const pairedOptions = getPairedSubjectBOptions({
    storyMode: StoryMode.FISHING_STRIKE,
    subjectA,
    animalOptions,
  });

  return uniqueOptions([
    currentValue,
    ...pairedOptions,
    ...FISHING_FOOD_SOURCE_PRIORITY,
    ...animalOptions,
  ]);
}

export function hasStoryModePairedAnimalOptions({
  storyMode,
  field,
  animalOptions,
  subjectA,
  subjectB,
}: {
  storyMode: StoryMode;
  field: SubjectOptionField;
  animalOptions: string[];
  subjectA?: string;
  subjectB?: string;
}) {
  const pairedOptions =
    field === "subjectB"
      ? getPairedSubjectBOptions({ storyMode, subjectA, animalOptions })
      : getPairedSubjectAOptions({ storyMode, subjectB, animalOptions });

  return pairedOptions.length > 0;
}
