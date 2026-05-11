import { HabitatRegion, StoryMode, type Season } from "@/types";

import {
  areAnimalNamesEquivalent,
  hasPredatorDataRelationship,
  isCuratedStoryModePair,
} from "@/lib/story-mode-animal-pairings";

export type StoryModePairQualityLevel = "strong" | "good" | "caution" | "weak";

export type StoryModePairQuality = {
  score: number;
  level: StoryModePairQualityLevel;
  label: string;
  reasons: string[];
  warnings: string[];
  suggestions: string[];
};

type EvaluateStoryModePairQualityArgs = {
  storyMode: StoryMode;
  subjectA?: string;
  subjectB?: string;
  habitatRegion: HabitatRegion;
  season: Season;
  animalOptions: string[];
};

const USA_VIRAL_ANIMALS = [
  "Bald Eagle",
  "Coyote",
  "Bison",
  "American Bison",
  "Bison Herd",
  "Wolf Pack",
  "Wolf",
  "Grizzly Bear",
  "Grizzly Mother",
  "Male Grizzly",
  "Black Bear",
  "Mountain Lion",
  "White-tailed Deer",
  "Mule Deer",
  "Bull Elk",
  "Bull Elk A",
  "Bull Elk B",
  "Elk Herd",
  "Moose",
  "Caribou Herd",
  "Trout",
  "Salmon",
  "Sockeye Salmon",
  "Red Fox",
  "Raven",
  "Osprey",
];

const FISH_FOOD_SOURCES = [
  "Trout",
  "Salmon",
  "Sockeye Salmon",
  "Fish",
  "Duck",
  "Rabbit",
];

const FISHING_STRIKE_ANIMALS = [
  "Bald Eagle",
  "Osprey",
  "Grizzly Bear",
  "Black Bear",
  "Brown Bear",
  "River Otter",
];

const MIGRATION_SPECIES = [
  "Elk Herd",
  "Elk",
  "Caribou Herd",
  "Caribou",
  "Bison Herd",
  "Bison",
  "American Bison",
  "Moose",
];

const WEATHER_SURVIVAL_SPECIES = [
  "American Bison",
  "Bison",
  "Bison Herd",
  "Elk Herd",
  "Elk",
  "Moose",
  "Caribou Herd",
  "Caribou",
  "Black Bear",
  "Grizzly Bear",
];

const HERD_OR_DEFENDER_SPECIES = [
  "Bison Herd",
  "Bison",
  "American Bison",
  "Elk Herd",
  "Elk",
  "Bull Elk",
  "Caribou Herd",
  "Caribou",
  "Moose",
  "Moose Cow",
  "Musk Ox Herd",
  "Musk Ox",
  "Cape Buffalo",
];

const HABITAT_ANIMALS: Partial<Record<HabitatRegion, string[]>> = {
  [HabitatRegion.YELLOWSTONE]: [
    "Bison",
    "American Bison",
    "Bison Herd",
    "Wolf Pack",
    "Wolf",
    "Grizzly Bear",
    "Grizzly Mother",
    "Male Grizzly",
    "Bull Elk",
    "Bull Elk A",
    "Bull Elk B",
    "Elk Herd",
    "Elk",
    "Moose",
    "Mountain Lion",
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
  [HabitatRegion.ROCKY_MOUNTAINS]: [
    "Mountain Lion",
    "Bighorn Ram",
    "Bull Elk",
    "Elk Herd",
    "Wolf Pack",
    "Grizzly Bear",
    "Black Bear",
    "Moose",
    "Coyote",
  ],
  [HabitatRegion.APPALACHIA]: [
    "Black Bear",
    "White-tailed Deer",
    "Coyote",
    "Red Fox",
    "Bobcat",
    "Trout",
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

function includesAnimal(options: string[], value?: string) {
  return options.some((option) => areAnimalNamesEquivalent(option, value));
}

function isKnownAnimal(value: string | undefined, animalOptions: string[]) {
  return Boolean(value?.trim()) && includesAnimal(animalOptions, value);
}

function bothUsaViral(subjectA?: string, subjectB?: string) {
  return (
    includesAnimal(USA_VIRAL_ANIMALS, subjectA) &&
    (!subjectB?.trim() || includesAnimal(USA_VIRAL_ANIMALS, subjectB))
  );
}

function isHabitatPlausible({
  habitatRegion,
  subjectA,
  subjectB,
}: {
  habitatRegion: HabitatRegion;
  subjectA?: string;
  subjectB?: string;
}) {
  const habitatAnimals = HABITAT_ANIMALS[habitatRegion];
  if (!habitatAnimals) return true;

  return (
    includesAnimal(habitatAnimals, subjectA) ||
    Boolean(subjectB?.trim() && includesAnimal(habitatAnimals, subjectB))
  );
}

function sameOrCloseSpecies(subjectA?: string, subjectB?: string) {
  return areAnimalNamesEquivalent(subjectA, subjectB);
}

function qualityFromScore(
  score: number
): Pick<StoryModePairQuality, "level" | "label"> {
  if (score >= 85) return { level: "strong", label: "Strong match" };
  if (score >= 70) return { level: "good", label: "Good match" };
  if (score >= 45) return { level: "caution", label: "Manual/custom match" };
  return { level: "weak", label: "Check pairing" };
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildQuality(
  score: number,
  details: Omit<StoryModePairQuality, "score" | "level" | "label">
): StoryModePairQuality {
  const finalScore = clampScore(score);
  return {
    score: finalScore,
    ...qualityFromScore(finalScore),
    reasons: details.reasons.slice(0, 2),
    warnings: details.warnings,
    suggestions: details.suggestions,
  };
}

export function evaluateStoryModePairQuality({
  storyMode,
  subjectA,
  subjectB,
  habitatRegion,
  season,
  animalOptions,
}: EvaluateStoryModePairQualityArgs): StoryModePairQuality {
  const trimmedA = subjectA?.trim() ?? "";
  const trimmedB = subjectB?.trim() ?? "";
  const hasA = Boolean(trimmedA);
  const hasB = Boolean(trimmedB);
  const isCurated = isCuratedStoryModePair({ storyMode, subjectA, subjectB });
  const isPredatorDataPair = hasPredatorDataRelationship({ subjectA, subjectB });
  const usaViral = bothUsaViral(subjectA, subjectB);
  const habitatPlausible = isHabitatPlausible({
    habitatRegion,
    subjectA,
    subjectB,
  });
  const knownA =
    isKnownAnimal(subjectA, animalOptions) ||
    includesAnimal(USA_VIRAL_ANIMALS, subjectA);
  const knownB =
    isKnownAnimal(subjectB, animalOptions) ||
    includesAnimal(USA_VIRAL_ANIMALS, subjectB);

  if (!hasA) {
    return buildQuality(45, {
      reasons: ["Select a subject animal to check the setup."],
      warnings: [],
      suggestions: ["Choose a known wildlife subject before generating."],
    });
  }

  if (storyMode === StoryMode.WEATHER_SURVIVAL) {
    const strongSubject = includesAnimal(WEATHER_SURVIVAL_SPECIES, subjectA);
    return buildQuality(strongSubject ? 86 : knownA ? 74 : 55, {
      reasons: [
        strongSubject
          ? `${trimmedA} is a solid weather-survival subject.`
          : "Only the subject animal is scored for Weather Survival.",
        season === "WINTER"
          ? "Winter reinforces the survival setup."
          : "Weather hazard is handled separately.",
      ],
      warnings: [],
      suggestions:
        strongSubject || knownA
          ? []
          : ["Use American Bison, Elk Herd, Moose, or Caribou Herd."],
    });
  }

  if (storyMode === StoryMode.MIGRATION) {
    const strongSubject = includesAnimal(MIGRATION_SPECIES, subjectA);
    return buildQuality(strongSubject ? 86 : knownA ? 74 : 55, {
      reasons: [
        strongSubject
          ? `${trimmedA} fits a migration or crossing setup.`
          : "Only the migrating species is animal-scored for Migration.",
        "Crossing type stays a route/obstacle field.",
      ],
      warnings: [],
      suggestions:
        strongSubject || knownA
          ? []
          : ["Use Elk Herd, Caribou Herd, Bison Herd, or Moose."],
    });
  }

  if (!hasB) {
    return buildQuality(48, {
      reasons: ["Second subject is open or custom."],
      warnings: ["The app cannot fully verify the animal pairing yet."],
      suggestions: ["Pick a matched second animal for stronger guidance."],
    });
  }

  if (storyMode === StoryMode.FISHING_STRIKE) {
    const validStrikeAnimal = includesAnimal(FISHING_STRIKE_ANIMALS, subjectA);
    const validFood = includesAnimal(FISH_FOOD_SOURCES, subjectB);

    if (!validFood) {
      return buildQuality(24, {
        reasons: ["Fishing Strike usually needs fish or a food source as field two."],
        warnings: [`${trimmedB} does not read as a fishing food source.`],
        suggestions: ["Use Trout, Salmon, Sockeye Salmon, or Fish."],
      });
    }

    return buildQuality(isCurated ? 92 : validStrikeAnimal ? 78 : 62, {
      reasons: [
        isCurated
          ? `${trimmedA} vs ${trimmedB} fits fishing-strike behavior.`
          : "Second field reads as a clean fish/food source.",
        usaViral ? "Pair is USA-viral friendly." : "Food source is plausible.",
      ],
      warnings: [],
      suggestions: validStrikeAnimal
        ? []
        : ["Use Bald Eagle, Osprey, Grizzly Bear, or Black Bear."],
    });
  }

  if (storyMode === StoryMode.RIVAL_CLASH) {
    if (isCurated || sameOrCloseSpecies(subjectA, subjectB)) {
      return buildQuality(isCurated ? 92 : 82, {
        reasons: [`${trimmedA} vs ${trimmedB} fits a close-rival standoff.`],
        warnings: [],
        suggestions: [],
      });
    }

    return buildQuality(34, {
      reasons: ["Rival Clash works best with same-species or close rivals."],
      warnings: [`${trimmedA} vs ${trimmedB} may read as unrelated species.`],
      suggestions: [
        "Use Bull Elk A vs Bull Elk B, Bison Bull A vs Bison Bull B, or Moose Bull vs Bull Moose.",
      ],
    });
  }

  if (
    storyMode === StoryMode.HERD_DEFENSE &&
    !includesAnimal(HERD_OR_DEFENDER_SPECIES, subjectA)
  ) {
    return buildQuality(40, {
      reasons: ["Herd Defense works best with a herd or defender in field one."],
      warnings: [`${trimmedA} may not read as the defending herd.`],
      suggestions: ["Use Bison Herd, Elk Herd, Caribou Herd, Moose, or Musk Ox Herd."],
    });
  }

  if (isCurated) {
    const score = 88 + (usaViral ? 6 : 0) + (habitatPlausible ? 4 : 0);
    return buildQuality(score, {
      reasons: [
        `${trimmedA} vs ${trimmedB} fits ${storyModeLabel(storyMode)} pressure.`,
        usaViral ? "Pair is USA-viral friendly." : "Pair is curated for this story mode.",
      ],
      warnings: habitatPlausible ? [] : ["Double-check the selected habitat."],
      suggestions: [],
    });
  }

  if (isPredatorDataPair) {
    return buildQuality(76 + (usaViral ? 4 : 0) + (habitatPlausible ? 3 : 0), {
      reasons: ["Pair is plausible from animal relationship data."],
      warnings: habitatPlausible ? [] : ["Habitat may need a quick realism check."],
      suggestions: [],
    });
  }

  if (!knownA || !knownB) {
    return buildQuality(52, {
      reasons: ["This pair is custom, so the app cannot verify it."],
      warnings: [],
      suggestions: ["Keep it if intentional, or choose a matched selector option."],
    });
  }

  return buildQuality(42, {
    reasons: ["This pair is known, but not matched for this story mode."],
    warnings: ["The setup may read less realistic or less story-specific."],
    suggestions: ["Choose one of the likely matched animals from the second selector."],
  });
}

function storyModeLabel(storyMode: StoryMode) {
  return storyMode
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
