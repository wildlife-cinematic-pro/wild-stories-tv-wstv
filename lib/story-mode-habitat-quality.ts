import { HabitatRegion, StoryMode, type Season, type TimeOfDay } from "@/types";

import { areAnimalNamesEquivalent } from "@/lib/story-mode-animal-pairings";

export type HabitatCompatibilityLevel = "strong" | "good" | "caution" | "weak";

export type HabitatCompatibility = {
  score: number;
  level: HabitatCompatibilityLevel;
  label: string;
  reasons: string[];
  warnings: string[];
  suggestions: string[];
};

type EvaluateHabitatCompatibilityArgs = {
  storyMode: StoryMode;
  subjectA?: string;
  subjectB?: string;
  habitatRegion: HabitatRegion;
  season: Season;
  timeOfDay: TimeOfDay;
  animalOptions: string[];
};

const HABITAT_ANIMALS: Record<HabitatRegion, string[]> = {
  [HabitatRegion.YELLOWSTONE]: [
    "Bison",
    "American Bison",
    "Bison Herd",
    "Wolf Pack",
    "Wolf",
    "Grizzly Bear",
    "Grizzly Mother",
    "Male Grizzly",
    "Elk Herd",
    "Bull Elk",
    "Bull Elk A",
    "Bull Elk B",
    "Moose",
    "Mountain Lion",
    "Mule Deer",
    "Coyote",
    "Bald Eagle",
  ],
  [HabitatRegion.ALASKA]: [
    "Bald Eagle",
    "Grizzly Bear",
    "Brown Bear",
    "Black Bear",
    "Sockeye Salmon",
    "Salmon",
    "Trout",
    "Fish",
    "Caribou Herd",
    "Caribou",
    "Moose",
    "Wolf Pack",
    "Wolf",
  ],
  [HabitatRegion.GREAT_PLAINS]: [
    "Bison",
    "American Bison",
    "Bison Herd",
    "Coyote",
    "White-tailed Deer",
    "Bald Eagle",
    "Wolf Pack",
  ],
  [HabitatRegion.PACIFIC_NORTHWEST]: [
    "Black Bear",
    "Bald Eagle",
    "Salmon",
    "Trout",
    "Mountain Lion",
    "Cougar",
    "Wolf Pack",
    "Elk Herd",
    "Elk",
  ],
  [HabitatRegion.EVERGLADES]: [
    "Alligator",
    "Crocodile",
    "Fish",
    "Bald Eagle",
    "Osprey",
    "Coyote",
    "White-tailed Deer",
  ],
  [HabitatRegion.ROCKY_MOUNTAINS]: [
    "Mountain Lion",
    "Cougar",
    "Bull Elk",
    "Bull Elk A",
    "Bull Elk B",
    "Elk Herd",
    "Bighorn Ram",
    "Grizzly Bear",
    "Black Bear",
    "Moose",
    "Coyote",
    "Wolf Pack",
  ],
  [HabitatRegion.APPALACHIA]: [
    "Black Bear",
    "White-tailed Deer",
    "Coyote",
    "Red Fox",
    "Bobcat",
    "Trout",
  ],
  [HabitatRegion.SOUTHWEST_DESERT]: [
    "Coyote",
    "Mountain Lion",
    "Cougar",
    "Bobcat",
    "Red Fox",
    "Jackrabbit",
    "Rabbit",
    "Bighorn Ram",
    "Golden Eagle",
  ],
  [HabitatRegion.COASTAL_WETLANDS]: [
    "Bald Eagle",
    "Osprey",
    "Fish",
    "Trout",
    "Salmon",
    "Alligator",
    "Coyote",
  ],
};

const OBVIOUS_MISMATCHES: Partial<Record<HabitatRegion, string[]>> = {
  [HabitatRegion.YELLOWSTONE]: ["Alligator", "Crocodile", "Lion", "Polar Bear"],
  [HabitatRegion.GREAT_PLAINS]: ["Polar Bear", "Alligator", "Crocodile", "Lion"],
  [HabitatRegion.ROCKY_MOUNTAINS]: ["Alligator", "Crocodile", "Lion"],
  [HabitatRegion.COASTAL_WETLANDS]: ["Grizzly Bear", "Polar Bear", "Lion"],
  [HabitatRegion.PACIFIC_NORTHWEST]: ["Alligator", "Crocodile", "Polar Bear", "Lion"],
  [HabitatRegion.APPALACHIA]: ["Alligator", "Crocodile", "Polar Bear", "Lion"],
  [HabitatRegion.SOUTHWEST_DESERT]: ["Polar Bear", "Alligator", "Crocodile"],
};

const FISH_FOOD_SOURCES = ["Trout", "Salmon", "Sockeye Salmon", "Fish"];
const SALMON_FRIENDLY_REGIONS = [
  HabitatRegion.ALASKA,
  HabitatRegion.PACIFIC_NORTHWEST,
  HabitatRegion.COASTAL_WETLANDS,
];
const REGION_LABELS: Record<HabitatRegion, string> = {
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

function includesAnimal(options: string[], value?: string) {
  return options.some((option) => areAnimalNamesEquivalent(option, value));
}

function uniqueOptions(options: Array<string | undefined>) {
  const seen = new Set<string>();

  return options.filter((option): option is string => {
    const normalized = option?.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function qualityFromScore(
  score: number
): Pick<HabitatCompatibility, "level" | "label"> {
  if (score >= 85) return { level: "strong", label: "Habitat fit: Strong" };
  if (score >= 70) return { level: "good", label: "Habitat fit: Good" };
  if (score >= 45) return { level: "caution", label: "Habitat caution" };
  return { level: "weak", label: "Habitat mismatch" };
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildCompatibility(
  score: number,
  details: Omit<HabitatCompatibility, "score" | "level" | "label">
): HabitatCompatibility {
  const finalScore = clampScore(score);

  return {
    score: finalScore,
    ...qualityFromScore(finalScore),
    reasons: details.reasons.slice(0, 2),
    warnings: details.warnings,
    suggestions: details.suggestions,
  };
}

function getScoredSubjects(storyMode: StoryMode, subjectA?: string, subjectB?: string) {
  if (
    storyMode === StoryMode.WEATHER_SURVIVAL ||
    storyMode === StoryMode.MIGRATION
  ) {
    return uniqueOptions([subjectA]);
  }

  return uniqueOptions([subjectA, subjectB]);
}

function getMismatchedAnimals(habitatRegion: HabitatRegion, animals: string[]) {
  const mismatches = OBVIOUS_MISMATCHES[habitatRegion] ?? [];
  return animals.filter((animal) => includesAnimal(mismatches, animal));
}

function isKnownAnimal(value: string, animalOptions: string[]) {
  return (
    includesAnimal(animalOptions, value) ||
    Object.values(HABITAT_ANIMALS).some((animals) => includesAnimal(animals, value))
  );
}

function getSeasonReason({
  storyMode,
  subjectB,
  habitatRegion,
  season,
}: {
  storyMode: StoryMode;
  subjectB?: string;
  habitatRegion: HabitatRegion;
  season: Season;
}) {
  if (storyMode === StoryMode.WEATHER_SURVIVAL && season === "WINTER") {
    return "Winter supports the weather-survival setup.";
  }
  if (storyMode === StoryMode.RIVAL_CLASH && season === "FALL") {
    return "Fall supports rut-season rival tension.";
  }
  if (
    storyMode === StoryMode.MIGRATION &&
    (season === "FALL" || season === "MIGRATION_SEASON")
  ) {
    return "Season supports migration movement.";
  }
  if (storyMode === StoryMode.MOTHER_BABY && season === "SPRING") {
    return "Spring supports calf or cub framing.";
  }
  if (
    storyMode === StoryMode.FISHING_STRIKE &&
    includesAnimal(FISH_FOOD_SOURCES, subjectB) &&
    SALMON_FRIENDLY_REGIONS.includes(habitatRegion)
  ) {
    return "Fishing strike fits this region.";
  }

  return undefined;
}

export function evaluateHabitatCompatibility({
  storyMode,
  subjectA,
  subjectB,
  habitatRegion,
  season,
  animalOptions,
}: EvaluateHabitatCompatibilityArgs): HabitatCompatibility {
  const scoredSubjects = getScoredSubjects(storyMode, subjectA, subjectB);
  const habitatAnimals = HABITAT_ANIMALS[habitatRegion];
  const regionLabel = REGION_LABELS[habitatRegion];

  if (!scoredSubjects.length) {
    return buildCompatibility(45, {
      reasons: ["Select a subject animal to check habitat fit."],
      warnings: [],
      suggestions: ["Choose a known wildlife subject before generating."],
    });
  }

  const mismatchedAnimals = getMismatchedAnimals(habitatRegion, scoredSubjects);
  if (mismatchedAnimals.length) {
    return buildCompatibility(24, {
      reasons: [`${mismatchedAnimals[0]} does not fit ${regionLabel}.`],
      warnings: [`${mismatchedAnimals[0]} is an obvious habitat mismatch.`],
      suggestions: [`Choose animals commonly found in ${regionLabel}.`],
    });
  }

  const unknownAnimals = scoredSubjects.filter(
    (animal) => !isKnownAnimal(animal, animalOptions)
  );
  if (unknownAnimals.length) {
    return buildCompatibility(55, {
      reasons: ["Custom animal habitat is not fully verified."],
      warnings: [],
      suggestions: [`Keep it if intentional, or choose a known ${regionLabel} animal.`],
    });
  }

  const fittingAnimals = scoredSubjects.filter((animal) =>
    includesAnimal(habitatAnimals, animal)
  );
  const seasonReason = getSeasonReason({
    storyMode,
    subjectB,
    habitatRegion,
    season,
  });

  if (fittingAnimals.length === scoredSubjects.length) {
    return buildCompatibility(seasonReason ? 94 : 90, {
      reasons: [
        `${scoredSubjects.join(" and ")} fit ${regionLabel}.`,
        seasonReason ?? "Habitat choice is realistic for this setup.",
      ],
      warnings: [],
      suggestions: [],
    });
  }

  if (fittingAnimals.length > 0) {
    return buildCompatibility(seasonReason ? 78 : 74, {
      reasons: [
        `${fittingAnimals[0]} fits ${regionLabel}.`,
        seasonReason ?? "At least one main animal fits this habitat.",
      ],
      warnings: [],
      suggestions: ["Frame the scene around the habitat-native subject."],
    });
  }

  return buildCompatibility(36, {
    reasons: [`Selected animals are not strong fits for ${regionLabel}.`],
    warnings: ["Habitat may read less realistic with this pair."],
    suggestions: [`Use animals commonly found in ${regionLabel}.`],
  });
}
